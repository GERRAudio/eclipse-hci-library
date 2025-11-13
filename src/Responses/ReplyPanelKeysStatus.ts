interface PanelKeyStatusResult {
    region: number;        // Region on the panel
    keyNumber: number;     // Key number within the region
    page: number;          // Page number for the key
    dakState: number;      // DAK state byte (key state, listen mode, pot state, etc.)
    keyIdentifier: string; // Human-readable key identifier (e.g., "R1K5P0")
}

interface PanelKeysStatusData {
    messageType: 'panelKeysStatus';
    messageID: number;
    timestamp: string;
    slot: number;              // Card slot number
    port: number;              // Port offset from first port of card
    panelIdentifier: string;   // Human-readable panel identifier
    count: number;             // Number of key status results
    keys: PanelKeyStatusResult[]; // Array of key status results
    rawPayload: string;
}

class ReplyPanelKeysStatus {
    public static parse(payload: Buffer): PanelKeysStatusData | null {
        // Check minimum payload size
        // Slot (1) + Port (1) + Count (2) = 4 bytes minimum
        if (payload.length < 4) {
            console.error('Panel keys status reply payload too short');
            return null;
        }

        // Log the raw payload with 0x between bytes
        console.log('Raw panel keys status payload:', payload.toString('hex').replace(/../g, '0x$& ').trim());

        let offset = 0;

        // Slot (1 byte)
        const slot = payload.readUInt8(offset);
        offset += 1;

        // Port (1 byte)
        const port = payload.readUInt8(offset);
        offset += 1;

        // Count (2 bytes)
        const count = payload.readUInt16BE(offset);
        offset += 2;

        console.log(`Parsing panel keys status reply: Slot=${slot}, Port=${port}, Count=${count}`);

        // Validate we have enough data for all key entries
        // Each entry is 4 bytes: Region (1) + Key (1) + Page (1) + DAK State (1)
        const expectedDataSize = count * 4;
        if (payload.length < 4 + expectedDataSize) {
            console.error(`Insufficient data: need ${4 + expectedDataSize} bytes, got ${payload.length}`);
            return null;
        }

        const keys: PanelKeyStatusResult[] = [];

        // Parse each key entry
        for (let i = 0; i < count; i++) {
            if (offset + 4 > payload.length) {
                console.error(`Insufficient data for key entry ${i + 1}`);
                return null;
            }

            // Region (1 byte)
            const region = payload.readUInt8(offset);
            offset += 1;

            // Key (1 byte)
            const keyNumber = payload.readUInt8(offset);
            offset += 1;

            // Page (1 byte)
            const page = payload.readUInt8(offset);
            offset += 1;

            // DAK state (1 byte)
            const dakState = payload.readUInt8(offset);
            offset += 1;

            // Create human-readable key identifier
            const keyIdentifier = `R${region}K${keyNumber}P${page}`;

            console.log(`Key status ${i + 1}: Region=${region}, Key=${keyNumber}, Page=${page}, DAK State=0x${dakState.toString(16).padStart(2, '0')} (${keyIdentifier})`);

            keys.push({
                region,
                keyNumber,
                page,
                dakState,
                keyIdentifier
            });
        }

        const panelIdentifier = `Slot ${slot}, Port ${port}`;

        return {
            messageType: 'panelKeysStatus',
            messageID: 0x00B2,
            timestamp: new Date().toISOString(),
            slot,
            port,
            panelIdentifier,
            count,
            keys,
            rawPayload: payload.toString('hex')
        };
    }

    public static displayPanelKeysStatus(data: PanelKeysStatusData): void {
        console.log('=== Panel Keys Status Reply ===');
        console.log(`Panel: ${data.panelIdentifier}`);
        console.log(`Slot: ${data.slot}`);
        console.log(`Port: ${data.port}`);
        console.log(`Status Count: ${data.count}`);
        console.log(`Keys Reported: ${data.keys.length}`);
        console.log(`Timestamp: ${data.timestamp}`);
        console.log('');
        
        if (data.keys.length > 0) {
            // Group keys by region for better display
            const keysByRegion = ReplyPanelKeysStatus.getKeysByRegion(data);
            
            Object.entries(keysByRegion).forEach(([region, regionKeys]) => {
                console.log(`--- Region ${region} (${regionKeys.length} keys) ---`);
                
                regionKeys.forEach((key, index) => {
                    const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
                    const stateIcon = dakParsed.keyState === 1 ? '🔴 ON' : '⚫ OFF';
                    const listenBadge = dakParsed.listenMode ? ' [LISTEN]' : '';
                    const pageInfo = key.page > 0 ? ` [Page ${key.page}]` : '';
                    const potInfo = dakParsed.potState > 0 ? ` Pot:${dakParsed.potState}` : '';
                    
                    console.log(`  ${index + 1}. Key ${key.keyNumber}${pageInfo}: ${stateIcon}${listenBadge}${potInfo}`);
                    console.log(`      ID: ${key.keyIdentifier}, DAK: 0x${key.dakState.toString(16).padStart(2, '0')}`);
                });
                console.log('');
            });

            // Summary statistics
            const stats = ReplyPanelKeysStatus.getKeyStatusStats(data);
            console.log('--- Status Summary ---');
            console.log(`Total Keys: ${data.keys.length}`);
            console.log(`Keys ON: ${stats.keysOn} | Keys OFF: ${stats.keysOff}`);
            console.log(`Listen Mode Active: ${stats.listenModeActive}`);
            console.log(`Pot Controls Active: ${stats.potControlsActive}`);
            console.log(`Regions: ${stats.regionsUsed}`);
            console.log(`Pages: ${stats.pagesUsed}`);
        } else {
            console.log('No key status data available');
        }
        console.log('==============================');
    }

    // Helper methods for filtering and analysis
    public static getKeysOn(data: PanelKeysStatusData): PanelKeyStatusResult[] {
        return data.keys.filter(key => {
            const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
            return dakParsed.keyState === 1;
        });
    }

    public static getKeysOff(data: PanelKeysStatusData): PanelKeyStatusResult[] {
        return data.keys.filter(key => {
            const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
            return dakParsed.keyState === 0;
        });
    }

    public static getListenModeKeys(data: PanelKeysStatusData): PanelKeyStatusResult[] {
        return data.keys.filter(key => {
            const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
            return dakParsed.listenMode;
        });
    }

    public static getKeysWithPotControl(data: PanelKeysStatusData): PanelKeyStatusResult[] {
        return data.keys.filter(key => {
            const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
            return dakParsed.potState > 0;
        });
    }

    public static getKeysByRegion(data: PanelKeysStatusData): Record<string, PanelKeyStatusResult[]> {
        const byRegion: Record<string, PanelKeyStatusResult[]> = {};
        
        data.keys.forEach(key => {
            const regionKey = key.region.toString();
            if (!byRegion[regionKey]) {
                byRegion[regionKey] = [];
            }
            byRegion[regionKey].push(key);
        });

        // Sort regions numerically
        const sortedRegions: Record<string, PanelKeyStatusResult[]> = {};
        Object.keys(byRegion)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach(region => {
                // Sort keys within region
                byRegion[region].sort((a, b) => a.keyNumber - b.keyNumber);
                sortedRegions[region] = byRegion[region];
            });

        return sortedRegions;
    }

    public static getKeysByPage(data: PanelKeysStatusData): Record<string, PanelKeyStatusResult[]> {
        const byPage: Record<string, PanelKeyStatusResult[]> = {};
        
        data.keys.forEach(key => {
            const pageKey = key.page.toString();
            if (!byPage[pageKey]) {
                byPage[pageKey] = [];
            }
            byPage[pageKey].push(key);
        });

        return byPage;
    }

    public static findKeyStatus(data: PanelKeysStatusData, region: number, keyNumber: number, page: number = 0): PanelKeyStatusResult | null {
        return data.keys.find(key => 
            key.region === region && 
            key.keyNumber === keyNumber && 
            key.page === page
        ) || null;
    }

    public static findKeyByIdentifier(data: PanelKeysStatusData, identifier: string): PanelKeyStatusResult | null {
        return data.keys.find(key => key.keyIdentifier === identifier) || null;
    }

    // Parse DAK state for analysis
    public static parseDAKState(dakState: number): {
        keyState: 0 | 1;
        keyStateName: string;
        listenMode: boolean;
        potState: number;
        reserved: boolean;
    } {
        return {
            keyState: (dakState & 0x03) as (0 | 1),
            keyStateName: (dakState & 0x03) === 1 ? 'ON' : 'OFF',
            listenMode: (dakState & 0x04) !== 0,
            potState: (dakState >> 4) & 0x0F,
            reserved: (dakState & 0x08) !== 0
        };
    }

    public static getKeyStatusStats(data: PanelKeysStatusData): {
        totalKeys: number;
        keysOn: number;
        keysOff: number;
        listenModeActive: number;
        potControlsActive: number;
        regionsUsed: number;
        pagesUsed: number;
        dakStateDistribution: Record<string, number>;
    } {
        if (data.keys.length === 0) {
            return {
                totalKeys: 0,
                keysOn: 0,
                keysOff: 0,
                listenModeActive: 0,
                potControlsActive: 0,
                regionsUsed: 0,
                pagesUsed: 0,
                dakStateDistribution: {}
            };
        }

        const regions = new Set(data.keys.map(key => key.region));
        const pages = new Set(data.keys.map(key => key.page));
        
        let keysOn = 0, keysOff = 0, listenModeActive = 0, potControlsActive = 0;
        const dakStateDistribution: Record<string, number> = {};

        data.keys.forEach(key => {
            const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
            
            if (dakParsed.keyState === 1) keysOn++;
            else keysOff++;
            
            if (dakParsed.listenMode) listenModeActive++;
            if (dakParsed.potState > 0) potControlsActive++;
            
            // Track DAK state distribution
            const stateKey = `0x${key.dakState.toString(16).padStart(2, '0')}`;
            dakStateDistribution[stateKey] = (dakStateDistribution[stateKey] || 0) + 1;
        });

        return {
            totalKeys: data.keys.length,
            keysOn,
            keysOff,
            listenModeActive,
            potControlsActive,
            regionsUsed: regions.size,
            pagesUsed: pages.size,
            dakStateDistribution
        };
    }

    public static formatKeysStatusTable(data: PanelKeysStatusData): string {
        if (data.keys.length === 0) {
            return `Panel ${data.panelIdentifier}: No key status data`;
        }

        const header = 'Key ID      | Region | Key # | Page | State | Listen | Pot | DAK State';
        const separator = '-'.repeat(75);
        
        const rows = data.keys.map(key => {
            const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
            const idStr = key.keyIdentifier.padEnd(11);
            const regionStr = key.region.toString().padStart(6);
            const keyStr = key.keyNumber.toString().padStart(5);
            const pageStr = key.page.toString().padStart(4);
            const stateStr = (dakParsed.keyState === 1 ? 'ON' : 'OFF').padEnd(5);
            const listenStr = (dakParsed.listenMode ? 'YES' : 'NO').padEnd(6);
            const potStr = dakParsed.potState.toString().padStart(3);
            const dakStr = `0x${key.dakState.toString(16).padStart(2, '0')}`;
            
            return `${idStr} | ${regionStr} | ${keyStr} | ${pageStr} | ${stateStr} | ${listenStr} | ${potStr} | ${dakStr}`;
        });

        return `Panel ${data.panelIdentifier} Key Status:\n${header}\n${separator}\n${rows.join('\n')}`;
    }

    public static getStatusSummary(data: PanelKeysStatusData): string {
        if (data.keys.length === 0) {
            return `Panel ${data.panelIdentifier}: No keys configured`;
        }

        const stats = ReplyPanelKeysStatus.getKeyStatusStats(data);
        return `Panel ${data.panelIdentifier}: ${stats.totalKeys} keys total. ` +
               `${stats.keysOn} ON, ${stats.keysOff} OFF. ` +
               `${stats.listenModeActive} listening, ${stats.potControlsActive} with pot control. ` +
               `Spans ${stats.regionsUsed} region(s) and ${stats.pagesUsed} page(s).`;
    }

    // Generate visual status map
    public static generateStatusMap(data: PanelKeysStatusData): string {
        if (data.keys.length === 0) {
            return 'No keys configured';
        }

        const keysByRegion = ReplyPanelKeysStatus.getKeysByRegion(data);
        const regions: string[] = [];

        Object.entries(keysByRegion).forEach(([region, keys]) => {
            const regionHeader = `Region ${region}:`;
            const keyList = keys.map(key => {
                const dakParsed = ReplyPanelKeysStatus.parseDAKState(key.dakState);
                const stateIcon = dakParsed.keyState === 1 ? '🔴' : '⚫';
                const listenIcon = dakParsed.listenMode ? '👂' : '';
                const pageInfo = key.page > 0 ? `(P${key.page})` : '';
                const potInfo = dakParsed.potState > 0 ? `[${dakParsed.potState}]` : '';
                return `${stateIcon}K${key.keyNumber}${pageInfo}${potInfo}${listenIcon}`;
            }).join(' ');
            
            regions.push(`${regionHeader} ${keyList}`);
        });

        return regions.join('\n');
    }

    // Compare with expected key configuration
    public static compareWithExpected(data: PanelKeysStatusData, expected: PanelKeyStatusResult[]): {
        matches: PanelKeyStatusResult[];
        missing: PanelKeyStatusResult[];
        unexpected: PanelKeyStatusResult[];
        stateChanges: { key: PanelKeyStatusResult; expectedState: number; actualState: number }[];
    } {
        const matches: PanelKeyStatusResult[] = [];
        const missing: PanelKeyStatusResult[] = [];
        const unexpected: PanelKeyStatusResult[] = [];
        const stateChanges: { key: PanelKeyStatusResult; expectedState: number; actualState: number }[] = [];

        // Find matches and state changes
        expected.forEach(expectedKey => {
            const actualKey = ReplyPanelKeysStatus.findKeyStatus(data, expectedKey.region, expectedKey.keyNumber, expectedKey.page);
            if (actualKey) {
                matches.push(actualKey);
                if (actualKey.dakState !== expectedKey.dakState) {
                    stateChanges.push({
                        key: actualKey,
                        expectedState: expectedKey.dakState,
                        actualState: actualKey.dakState
                    });
                }
            } else {
                missing.push(expectedKey);
            }
        });

        // Find unexpected keys
        data.keys.forEach(actualKey => {
            const expectedKey = expected.find(exp => 
                exp.region === actualKey.region && 
                exp.keyNumber === actualKey.keyNumber && 
                exp.page === actualKey.page
            );
            if (!expectedKey) {
                unexpected.push(actualKey);
            }
        });

        return { matches, missing, unexpected, stateChanges };
    }
}

export { ReplyPanelKeysStatus, PanelKeysStatusData, PanelKeyStatusResult };