interface PanelInfo {
    panelNumber: number;        // Full panel number (LSB + MSB)
    panelType: PanelType;       // Type of panel/endpoint
    panelTypeName: string;      // Human-readable panel type name
    state: PanelState;          // Panel state (unknown/good/faulty/reserved)
    stateName: string;          // Human-readable state name
    isAoIPDevice: boolean;      // Whether this is an AoIP device
    isOnline: boolean;          // Convenience property (state === 'good')
}

type PanelType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type PanelState = 0 | 1 | 2 | 3;

interface PanelStatusData {
    messageType: 'panelStatus';
    messageID: number;
    timestamp: string;
    isUpdate: boolean;          // true if automatic update, false if response to request
    count: number;
    panels: PanelInfo[];
    rawPayload: string;
}

class ReplyPanelStatus {
    private static readonly PANEL_TYPES: Record<PanelType, string> = {
        1: 'Generic Panel',
        2: 'FS1 Antenna 1.9GHz',
        3: 'FS2 Antenna 1.9GHz',
        4: 'FS2 Antenna 2.4GHz',
        5: 'Antenna Type Unknown',
        6: 'Direct (includes hosted directs)',
        7: 'FS2 Antenna 5.0GHz',
        8: 'AES67 Direct'
    };

    private static readonly PANEL_STATES: Record<PanelState, string> = {
        0: 'Unknown',
        1: 'Good',
        2: 'Faulty',
        3: 'Reserved'
    };

    public static parse(payload: Buffer, flags: any): PanelStatusData | null {
        // Check minimum payload size
        // Count (2) = 2 bytes minimum
        if (payload.length < 2) {
            console.error('Panel status reply payload too short');
            return null;
        }

        // Log the raw payload with 0x between bytes
        console.log('Raw panel status payload:', payload.toString('hex').replace(/../g, '0x$& ').trim());

        let offset = 0;

        // Count (2 bytes)
        const count = payload.readUInt16BE(offset);
        offset += 2;

        console.log(`Parsing panel status with count: ${count}`);

        // Determine if this is an update (automatic) or response to request
        const isUpdate = flags.U || false;
        console.log(`Response type: ${isUpdate ? 'Automatic Update (state changes)' : 'Status Response (complete list)'}`);

        // Validate we have enough data for all panel entries
        // Each entry is 4 bytes: Panel LSB (1) + Panel Type (1) + Condition (1) + Panel MSB (1)
        const expectedDataSize = count * 4;
        if (payload.length < 2 + expectedDataSize) {
            console.error(`Insufficient data: need ${2 + expectedDataSize} bytes, got ${payload.length}`);
            return null;
        }

        const panels: PanelInfo[] = [];

        // Parse each panel entry
        for (let i = 0; i < count; i++) {
            if (offset + 4 > payload.length) {
                console.error(`Insufficient data for panel entry ${i + 1}`);
                return null;
            }

            // Panel number LSB (1 byte)
            const panelLSB = payload.readUInt8(offset);
            offset += 1;

            // Panel type (1 byte)
            const panelType = payload.readUInt8(offset) as PanelType;
            offset += 1;

            // Condition (1 byte)
            const condition = payload.readUInt8(offset);
            offset += 1;

            // Panel number MSB (1 byte)
            const panelMSB = payload.readUInt8(offset);
            offset += 1;

            // Extract fields from condition byte
            const state = (condition & 0x7F) as PanelState;        // bits 0-6: state (7 bits)
            const isAoIPDevice = (condition & 0x80) !== 0;         // bit 7: AoIP device flag

            // Combine LSB and MSB to get full panel number
            const panelNumber = (panelMSB << 8) | panelLSB;

            // Get human-readable names
            const panelTypeName = this.PANEL_TYPES[panelType] || `Unknown Type ${panelType}`;
            const stateName = this.PANEL_STATES[state] || `Unknown State ${state}`;
            const isOnline = state === 1; // Good state means online

            console.log(`Panel entry ${i + 1}: Number=${panelNumber} (LSB=${panelLSB}, MSB=${panelMSB}), Type=${panelType} (${panelTypeName}), State=${state} (${stateName}), AoIP=${isAoIPDevice}`);

            panels.push({
                panelNumber,
                panelType,
                panelTypeName,
                state,
                stateName,
                isAoIPDevice,
                isOnline
            });
        }

        return {
            messageType: 'panelStatus',
            messageID: 0x001E,
            timestamp: new Date().toISOString(),
            isUpdate,
            count,
            panels,
            rawPayload: payload.toString('hex')
        };
    }

    public static getPanelSummary(data: PanelStatusData): string {
        if (data.panels.length === 0) {
            return data.isUpdate ? 'No panel state changes' : 'No panels found in system';
        }

        const typeStr = data.isUpdate ? 'Changed Panels' : 'System Panels';
        const summary = data.panels.map((panel, index) => {
            const statusIcon = panel.isOnline ? '🟢' : panel.state === 2 ? '🔴' : '⚫';
            const aoipIcon = panel.isAoIPDevice ? '🌐' : '';
            return `${index + 1}. Panel ${panel.panelNumber}: ${panel.panelTypeName} - ${panel.stateName} ${statusIcon}${aoipIcon}`;
        });

        return `${typeStr}:\n${summary.join('\n')}`;
    }

    public static displayPanelStatus(data: PanelStatusData): void {
        console.log('=== Panel Status Reply ===');
        console.log(`Response Type: ${data.isUpdate ? 'Automatic Update (state changes)' : 'Complete Status Response'}`);
        console.log(`Count: ${data.count}`);
        console.log(`Panels: ${data.panels.length}`);
        console.log(`Timestamp: ${data.timestamp}`);
        console.log('');

        if (data.panels.length > 0) {
            data.panels.forEach((panel, index) => {
                const statusIcon = panel.isOnline ? '🟢 ONLINE' : panel.state === 2 ? '🔴 FAULTY' : panel.state === 0 ? '⚫ UNKNOWN' : '⚪ RESERVED';
                const aoipBadge = panel.isAoIPDevice ? ' [AoIP]' : '';

                console.log(`${index + 1}. Panel ${panel.panelNumber.toString().padStart(4)}: ${panel.panelTypeName}`);
                console.log(`    Status: ${statusIcon}${aoipBadge}`);
                console.log('');
            });

            // Summary statistics
            const stats = ReplyPanelStatus.getPanelStats(data);
            console.log('--- Summary ---');
            console.log(`Total Panels: ${data.panels.length}`);
            console.log(`Online: ${stats.online} | Faulty: ${stats.faulty} | Unknown: ${stats.unknown} | Reserved: ${stats.reserved}`);
            console.log(`AoIP Devices: ${stats.aoipDevices}`);
            console.log(`Panel Types: ${Object.keys(stats.byType).length} different types`);

            // Show type breakdown
            Object.entries(stats.byType).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
        } else {
            if (data.isUpdate) {
                console.log('No panel state changes detected');
            } else {
                console.log('No panels found in the system');
            }
        }
        console.log('==========================');
    }

    // Helper methods for filtering and analysis
    public static getOnlinePanels(data: PanelStatusData): PanelInfo[] {
        return data.panels.filter(panel => panel.isOnline);
    }

    public static getOfflinePanels(data: PanelStatusData): PanelInfo[] {
        return data.panels.filter(panel => !panel.isOnline);
    }

    public static getFaultyPanels(data: PanelStatusData): PanelInfo[] {
        return data.panels.filter(panel => panel.state === 2);
    }

    public static getUnknownStatePanels(data: PanelStatusData): PanelInfo[] {
        return data.panels.filter(panel => panel.state === 0);
    }

    public static getAoIPDevices(data: PanelStatusData): PanelInfo[] {
        return data.panels.filter(panel => panel.isAoIPDevice);
    }

    public static getPanelsByType(data: PanelStatusData, panelType: PanelType): PanelInfo[] {
        return data.panels.filter(panel => panel.panelType === panelType);
    }

    public static getPanelByNumber(data: PanelStatusData, panelNumber: number): PanelInfo | null {
        return data.panels.find(panel => panel.panelNumber === panelNumber) || null;
    }

    public static getDirectPanels(data: PanelStatusData): PanelInfo[] {
        // Direct panels are type 6 and 8
        return data.panels.filter(panel => panel.panelType === 6 || panel.panelType === 8);
    }

    public static getWirelessPanels(data: PanelStatusData): PanelInfo[] {
        // Wireless panels are types 2, 3, 4, 7 (various antenna types)
        return data.panels.filter(panel => [2, 3, 4, 7].includes(panel.panelType));
    }

    public static getPanelStats(data: PanelStatusData): {
        total: number;
        online: number;
        faulty: number;
        unknown: number;
        reserved: number;
        aoipDevices: number;
        byType: Record<string, number>;
        byState: Record<string, number>;
    } {
        const byType: Record<string, number> = {};
        const byState: Record<string, number> = {};

        let online = 0, faulty = 0, unknown = 0, reserved = 0, aoipDevices = 0;

        data.panels.forEach(panel => {
            // Count by type
            byType[panel.panelTypeName] = (byType[panel.panelTypeName] || 0) + 1;

            // Count by state
            byState[panel.stateName] = (byState[panel.stateName] || 0) + 1;

            // Count specific states
            switch (panel.state) {
                case 1: online++; break;
                case 2: faulty++; break;
                case 0: unknown++; break;
                case 3: reserved++; break;
            }

            if (panel.isAoIPDevice) aoipDevices++;
        });

        return {
            total: data.panels.length,
            online,
            faulty,
            unknown,
            reserved,
            aoipDevices,
            byType,
            byState
        };
    }

    public static formatPanelTable(data: PanelStatusData): string {
        if (data.panels.length === 0) {
            return data.isUpdate ? 'No panel state changes' : 'No panels in system';
        }

        const header = 'Panel # | Type                          | State    | AoIP';
        const separator = '-'.repeat(65);

        const rows = data.panels.map(panel => {
            const panelNumStr = panel.panelNumber.toString().padStart(7);
            const typeStr = panel.panelTypeName.padEnd(29);
            const stateStr = panel.stateName.padEnd(8);
            const aoipStr = panel.isAoIPDevice ? 'Yes' : 'No';

            return `${panelNumStr} | ${typeStr} | ${stateStr} | ${aoipStr}`;
        });

        const typeHeader = data.isUpdate ? 'Panel State Changes:' : 'System Panel Status:';
        return `${typeHeader}\n${header}\n${separator}\n${rows.join('\n')}`;
    }

    // Get health summary
    public static getHealthSummary(data: PanelStatusData): {
        healthScore: number;        // 0-100 percentage
        issues: string[];
        recommendations: string[];
    } {
        if (data.panels.length === 0) {
            return {
                healthScore: 100,
                issues: [],
                recommendations: []
            };
        }

        const stats = this.getPanelStats(data);
        const healthScore = Math.round((stats.online / stats.total) * 100);
        const issues: string[] = [];
        const recommendations: string[] = [];

        if (stats.faulty > 0) {
            issues.push(`${stats.faulty} faulty panel(s) detected`);
            recommendations.push('Check network connections and panel power for faulty devices');
        }

        if (stats.unknown > 0) {
            issues.push(`${stats.unknown} panel(s) in unknown state`);
            recommendations.push('Monitor panels with unknown state - they may be coming online');
        }

        if (healthScore < 80) {
            issues.push(`Only ${healthScore}% of panels are online`);
            recommendations.push('Investigate network infrastructure and panel connectivity');
        }

        if (stats.aoipDevices > 0 && stats.aoipDevices < stats.total) {
            recommendations.push('Mixed AoIP and traditional devices - ensure proper network configuration');
        }

        return { healthScore, issues, recommendations };
    }

    // Compare with previous status (for monitoring changes)
    public static compareStatus(current: PanelStatusData, previous: PanelStatusData): {
        newOnline: PanelInfo[];
        newOffline: PanelInfo[];
        newFaulty: PanelInfo[];
        recovered: PanelInfo[];
        stateChanged: { panel: PanelInfo; oldState: PanelState; newState: PanelState }[];
    } {
        const currentPanels = new Map(current.panels.map(p => [p.panelNumber, p]));
        const previousPanels = new Map(previous.panels.map(p => [p.panelNumber, p]));

        const newOnline: PanelInfo[] = [];
        const newOffline: PanelInfo[] = [];
        const newFaulty: PanelInfo[] = [];
        const recovered: PanelInfo[] = [];
        const stateChanged: { panel: PanelInfo; oldState: PanelState; newState: PanelState }[] = [];

        for (const [panelNumber, currentPanel] of currentPanels) {
            const previousPanel = previousPanels.get(panelNumber);

            if (!previousPanel) {
                // New panel appeared
                if (currentPanel.isOnline) {
                    newOnline.push(currentPanel);
                }
            } else if (previousPanel.state !== currentPanel.state) {
                // State changed
                stateChanged.push({
                    panel: currentPanel,
                    oldState: previousPanel.state,
                    newState: currentPanel.state
                });

                if (!previousPanel.isOnline && currentPanel.isOnline) {
                    recovered.push(currentPanel);
                } else if (previousPanel.isOnline && !currentPanel.isOnline) {
                    newOffline.push(currentPanel);
                }

                if (currentPanel.state === 2 && previousPanel.state !== 2) {
                    newFaulty.push(currentPanel);
                }
            }
        }

        return { newOnline, newOffline, newFaulty, recovered, stateChanged };
    }
}

export { ReplyPanelStatus, PanelStatusData, PanelInfo, PanelType, PanelState };