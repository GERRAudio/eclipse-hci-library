import { PANEL_TYPES, getPanelTypeName } from '../DataStructures/PanelTypes';
import { PORT_TYPES, getPortTypeName } from '../DataStructures/PortTypes';
import { EXPANSION_PANEL_TYPES, getExpansionPanelTypeName } from '../DataStructures/ExpansionPanelTypes';

interface ExpansionPanel {
    region: number;              // Expansion panel region
    type: number;                // Panel type (1=Lever, 2=Push, 3=Rotary, 4=16 key lever, 0=Not set)
    typeName: string;            // Human-readable type name
    currentPage: number;         // Current page number
    appVersion: {                // Application version
        major: number;
        minor: number;
        revision: number;
        versionString: string;
    };
    bootVersion: {               // Boot version
        major: number;
        minor: number;
        revision: number;
        versionString: string;
    };
}

interface PortInfo {
    portNumber: number;                    // Port number (16-bit)
    panelType: number;                     // Panel type ID (16-bit)
    panelTypeName: string;                 // Human-readable panel type name
    operationalStatus: {                   // Panel operational status byte
        online: boolean;                   // Bit 0: Online status
        subType: boolean;                  // Bit 1: SubType flag
        usage: boolean;                    // Bit 1: Usage flag (LQ or V-Series Iris)
        portType: number;                  // Bits 2-7: Port type
        portTypeName: string;              // Human-readable port type name
    };
    panelFirmware: string;                 // 8-byte firmware string
    bootVersion: {                         // Boot version (4 bytes)
        major: number;
        minor: number;
        revision: number;
        versionString: string;
    };
    kernelVersion: {                       // Kernel version (4 bytes)
        major: number;
        minor: number;
        revision: number;
        versionString: string;
    };
    fileSystemVersion: {                   // FileSystem version (4 bytes)
        major: number;
        minor: number;
        revision: number;
        versionString: string;
    };
    talkListenLabel: string;               // Talk & Listen label (10 words/20 bytes)
    talkListenAliasLabel: string;          // Talk & Listen alias label (10 words/20 bytes)
    numberOfKeys: number;                  // Number of keys on panel (8-bit)
    answerBackTimeout: number;             // Answer back timeout (1-60 secs, 0=disabled)
    numberOfExpansionPanels: number;       // Number of expansion panels supported
    expansionPanelStartRegion: number;     // Region where first expansion panel starts
    expansionPanels: ExpansionPanel[];     // Array of expansion panels
}

interface PortInfoData {
    messageType: 'portInfo';
    messageID: number;
    timestamp: string;
    slotNumber: number;            // Card slot number (16-bit)
    numberOfPorts: number;         // Number of ports in response
    ports: PortInfo[];             // Array of port information
    rawPayload: string;
}

class ReplyPortInfo {
    public static parse(payload: Buffer): PortInfoData | null {
        // Check minimum payload size
        // Slot Number (2) + Number Ports (1) = 3 bytes minimum
        if (payload.length < 3) {
            console.error('Port info reply payload too short');
            return null;
        }

        // Log the raw payload with 0x between bytes
        console.log('Raw port info payload:', payload.toString('hex').replace(/../g, '0x$& ').trim());

        let offset = 0;

        // Slot Number (2 bytes)
        const slotNumber = payload.readUInt16BE(offset);
        offset += 2;

        // Number of Ports (1 byte)
        const numberOfPorts = payload.readUInt8(offset);
        offset += 1;

        console.log(`Parsing port info: Slot=${slotNumber}, Number of Ports=${numberOfPorts}`);

        const ports: PortInfo[] = [];

        // Parse each port
        for (let i = 0; i < numberOfPorts; i++) {
            console.log(`Parsing port ${i + 1}/${numberOfPorts} at offset ${offset}`);

            // Check if we have enough data for this port (minimum required fields)
            if (offset + 67 > payload.length) { // Minimum size without expansion panels
                console.error(`Insufficient data for port ${i + 1}`);
                return null;
            }

            // Port number (2 bytes)
            const portNumber = payload.readUInt16BE(offset);
            offset += 2;

            // Panel Type (2 bytes)
            const panelType = payload.readUInt16BE(offset);
            offset += 2;

            // Panel Operational Status (1 byte)
            const operationalStatusByte = payload.readUInt8(offset);
            offset += 1;

            // Panel Firmware (8 bytes string)
            const panelFirmware = payload.subarray(offset, offset + 8).toString('utf8').replace(/\0/g, '');
            offset += 8;

            // Boot Version (4 bytes)
            const bootMajor = payload.readUInt8(offset);
            const bootMinor = payload.readUInt8(offset + 1);
            const bootRevision = payload.readUInt16BE(offset + 2);
            offset += 4;

            // Kernel Version (4 bytes)
            const kernelMajor = payload.readUInt8(offset);
            const kernelMinor = payload.readUInt8(offset + 1);
            const kernelRevision = payload.readUInt16BE(offset + 2);
            offset += 4;

            // FileSystem Version (4 bytes)
            const fsMajor = payload.readUInt8(offset);
            const fsMinor = payload.readUInt8(offset + 1);
            const fsRevision = payload.readUInt16BE(offset + 2);
            offset += 4;

            // Reserved (4 bytes)
            offset += 4;

            // Talk & Listen Label (10 words = 20 bytes)
            const talkListenLabel = payload.subarray(offset, offset + 20).toString('utf8').replace(/\0/g, '');
            offset += 20;

            // Talk & Listen Alias Label (10 words = 20 bytes)
            const talkListenAliasLabel = payload.subarray(offset, offset + 20).toString('utf8').replace(/\0/g, '');
            offset += 20;

            // Number Of Keys (1 byte)
            const numberOfKeys = payload.readUInt8(offset);
            offset += 1;

            // Answer Back Timeout (1 byte)
            const answerBackTimeout = payload.readUInt8(offset);
            offset += 1;

            // Number of Expansion panels (1 byte)
            const numberOfExpansionPanels = payload.readUInt8(offset);
            offset += 1;

            // Expansion Panel start region (1 byte)
            const expansionPanelStartRegion = payload.readUInt8(offset);
            offset += 1;

            // Parse expansion panels
            const expansionPanels: ExpansionPanel[] = [];
            for (let j = 0; j < numberOfExpansionPanels; j++) {
                if (offset + 12 > payload.length) {
                    console.error(`Insufficient data for expansion panel ${j + 1}`);
                    return null;
                }

                // Region (1 byte)
                const region = payload.readUInt8(offset);
                offset += 1;

                // Type (2 bytes)
                const type = payload.readUInt16BE(offset);
                offset += 2;

                // Current Page (1 byte)
                const currentPage = payload.readUInt8(offset);
                offset += 1;

                // App Version (4 bytes)
                const appMajor = payload.readUInt8(offset);
                const appMinor = payload.readUInt8(offset + 1);
                const appRevision = payload.readUInt16BE(offset + 2);
                offset += 4;

                // Boot Version (4 bytes)
                const expBootMajor = payload.readUInt8(offset);
                const expBootMinor = payload.readUInt8(offset + 1);
                const expBootRevision = payload.readUInt16BE(offset + 2);
                offset += 4;

                expansionPanels.push({
                    region,
                    type,
                    typeName: getExpansionPanelTypeName(type),
                    currentPage,
                    appVersion: {
                        major: appMajor,
                        minor: appMinor,
                        revision: appRevision,
                        versionString: `${appMajor}.${appMinor}.${appRevision}`
                    },
                    bootVersion: {
                        major: expBootMajor,
                        minor: expBootMinor,
                        revision: expBootRevision,
                        versionString: `${expBootMajor}.${expBootMinor}.${expBootRevision}`
                    }
                });
            }

            // Parse operational status
            const online = (operationalStatusByte & 0x01) !== 0;
            const subType = (operationalStatusByte & 0x02) !== 0;
            const usage = (operationalStatusByte & 0x02) !== 0; // Same as subType per spec
            const portType = (operationalStatusByte >> 2) & 0x3F;

            const portInfo: PortInfo = {
                portNumber,
                panelType,
                panelTypeName: getPanelTypeName(panelType),
                operationalStatus: {
                    online,
                    subType,
                    usage,
                    portType,
                    portTypeName: getPortTypeName(portType)
                },
                panelFirmware,
                bootVersion: {
                    major: bootMajor,
                    minor: bootMinor,
                    revision: bootRevision,
                    versionString: `${bootMajor}.${bootMinor}.${bootRevision}`
                },
                kernelVersion: {
                    major: kernelMajor,
                    minor: kernelMinor,
                    revision: kernelRevision,
                    versionString: `${kernelMajor}.${kernelMinor}.${kernelRevision}`
                },
                fileSystemVersion: {
                    major: fsMajor,
                    minor: fsMinor,
                    revision: fsRevision,
                    versionString: `${fsMajor}.${fsMinor}.${fsRevision}`
                },
                talkListenLabel,
                talkListenAliasLabel,
                numberOfKeys,
                answerBackTimeout,
                numberOfExpansionPanels,
                expansionPanelStartRegion,
                expansionPanels
            };

            console.log(`Port ${i + 1}: Number=${portNumber}, Type=${portInfo.panelTypeName}, Online=${online}, Keys=${numberOfKeys}, Expansions=${numberOfExpansionPanels}`);

            ports.push(portInfo);
        }

        return {
            messageType: 'portInfo',
            messageID: 0x00B8,
            timestamp: new Date().toISOString(),
            slotNumber,
            numberOfPorts,
            ports,
            rawPayload: payload.toString('hex')
        };
    }

    public static displayPortInfo(data: PortInfoData): void {
        console.log('=== Port Information Reply ===');
        console.log(`Slot: ${data.slotNumber}`);
        console.log(`Number of Ports: ${data.numberOfPorts}`);
        console.log(`Timestamp: ${data.timestamp}`);
        console.log('');

        data.ports.forEach((port, index) => {
            console.log(`--- Port ${index + 1}: ${port.portNumber} ---`);
            console.log(`Panel Type: ${port.panelTypeName} (0x${port.panelType.toString(16).padStart(4, '0')})`);
            console.log(`Port Type: ${port.operationalStatus.portTypeName}`);
            console.log(`Status: ${port.operationalStatus.online ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
            console.log(`Firmware: ${port.panelFirmware}`);
            console.log(`Boot Version: ${port.bootVersion.versionString}`);
            console.log(`Kernel Version: ${port.kernelVersion.versionString}`);
            console.log(`FileSystem Version: ${port.fileSystemVersion.versionString}`);
            console.log(`Keys: ${port.numberOfKeys}`);
            console.log(`Answer Back Timeout: ${port.answerBackTimeout === 0 ? 'Disabled' : `${port.answerBackTimeout}s`}`);

            if (port.talkListenLabel) {
                console.log(`Talk & Listen Label: "${port.talkListenLabel}"`);
            }

            if (port.talkListenAliasLabel) {
                console.log(`Talk & Listen Alias: "${port.talkListenAliasLabel}"`);
            }

            if (port.numberOfExpansionPanels > 0) {
                console.log(`Expansion Panels: ${port.numberOfExpansionPanels} (starting at region ${port.expansionPanelStartRegion})`);
                port.expansionPanels.forEach((exp, expIndex) => {
                    console.log(`  ${expIndex + 1}. Region ${exp.region}: ${exp.typeName} (Page ${exp.currentPage})`);
                    console.log(`     App: ${exp.appVersion.versionString}, Boot: ${exp.bootVersion.versionString}`);
                });
            }
            console.log('');
        });

        // Summary
        const onlinePorts = data.ports.filter(p => p.operationalStatus.online).length;
        const totalKeys = data.ports.reduce((sum, p) => sum + p.numberOfKeys, 0);
        const totalExpansions = data.ports.reduce((sum, p) => sum + p.numberOfExpansionPanels, 0);

        console.log('--- Summary ---');
        console.log(`Online Ports: ${onlinePorts}/${data.numberOfPorts}`);
        console.log(`Total Keys: ${totalKeys}`);
        console.log(`Total Expansion Panels: ${totalExpansions}`);

        console.log('==============================');
    }

    // Helper methods
    public static getOnlinePorts(data: PortInfoData): PortInfo[] {
        return data.ports.filter(port => port.operationalStatus.online);
    }

    public static getOfflinePorts(data: PortInfoData): PortInfo[] {
        return data.ports.filter(port => !port.operationalStatus.online);
    }

    public static getPortsByType(data: PortInfoData, portType: number): PortInfo[] {
        return data.ports.filter(port => port.operationalStatus.portType === portType);
    }

    public static getPanelPorts(data: PortInfoData): PortInfo[] {
        return this.getPortsByType(data, 14); // Port type 14 = Panel
    }

    public static getTrunkPorts(data: PortInfoData): PortInfo[] {
        return data.ports.filter(port =>
            port.operationalStatus.portType === 18 || // Trunk (non EQue)
            port.operationalStatus.portType === 11 || // EQue Trunk
            port.operationalStatus.portType === 25 || // Fibre Trunk
            port.operationalStatus.portType === 27    // EQue T1 Trunk
        );
    }

    public static getBeltpackPorts(data: PortInfoData): PortInfo[] {
        return this.getPortsByType(data, 1); // Port type 1 = Beltpack
    }

    public static getPortStats(data: PortInfoData): {
        totalPorts: number;
        onlinePorts: number;
        offlinePorts: number;
        totalKeys: number;
        totalExpansionPanels: number;
        portTypeBreakdown: Record<string, number>;
        panelTypeBreakdown: Record<string, number>;
    } {
        const portTypeBreakdown: Record<string, number> = {};
        const panelTypeBreakdown: Record<string, number> = {};

        let totalKeys = 0;
        let totalExpansionPanels = 0;
        let onlinePorts = 0;

        data.ports.forEach(port => {
            if (port.operationalStatus.online) onlinePorts++;
            totalKeys += port.numberOfKeys;
            totalExpansionPanels += port.numberOfExpansionPanels;

            const portTypeName = port.operationalStatus.portTypeName;
            const panelTypeName = port.panelTypeName;

            portTypeBreakdown[portTypeName] = (portTypeBreakdown[portTypeName] || 0) + 1;
            panelTypeBreakdown[panelTypeName] = (panelTypeBreakdown[panelTypeName] || 0) + 1;
        });

        return {
            totalPorts: data.numberOfPorts,
            onlinePorts,
            offlinePorts: data.numberOfPorts - onlinePorts,
            totalKeys,
            totalExpansionPanels,
            portTypeBreakdown,
            panelTypeBreakdown
        };
    }
}

export { ReplyPortInfo, PortInfoData, PortInfo, ExpansionPanel };