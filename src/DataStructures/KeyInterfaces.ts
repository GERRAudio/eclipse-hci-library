export interface KeyConfiguration {
    region: number;                    // Region this key is on
    keyId: number;                     // Key ID
    page: number;                      // Page this key is on
    entity: number;                    // Entity type (e.g., EN_PORT, EN_GROUP)
    entityName: string;                // Human-readable entity name
    keyIdentifier: string;             // Human-readable key identifier (e.g., "R1K5P0")
    keyStatus: {                       // Key Status byte
        keyState: number;              // Bits 6-7: Key state
        keyStateName: string;          // Human-readable key state
        listenMode: boolean;           // Bit 5: Listen mode
        potAssigned: boolean;          // Bit 4: Pot assigned
        potState: number;              // Bits 0-3: Pot state (0-15)
    };
    potNumber: number;                 // Pot number (16-bit)
    keyOperation: {                    // Key Operation (4 bytes)
        unpaged: boolean;              // Bit 8: 0=paged, 1=unpaged
        textMode: boolean;             // Bit 7: Text display mode
        dual: boolean;                 // Bit 6: Double width
        dial: boolean;                 // Bit 5: Dial mode
        latchMode: number;             // Bits 0-3: Latch mode
        latchModeName: string;         // Human-readable latch mode
        group: number;                 // Bits 4-7: Interlock group
        deactivating: boolean;         // Bit 3: All interlock group keys may be off
        makeBreak: boolean;            // Bit 2: Make before break
        crossPage: boolean;            // Bit 1: Keys interlocked across pages
        cmapsiSp1: boolean;            // Bit 0: CMAPSi flag special 1
        cmapsiSp2: boolean;            // Bit 7: CMAPSi flag special 2
        regionValue: number;           // Bits 4-6: Key region number
        stackedGroup: boolean;         // Bit 3: Stacked group indicator
    };
    pageValue: number;                 // Page switch target (if page key)
    keyConfig: {                       // Key Config (26 bytes)
        systemNumber: number;          // System number
        specificUse: number;           // Entity-specific data (16-bit)
        secondaryDcc: number;          // Secondary DCC/DialCode (16-bit)
        keyAction: {                   // Key Action (16-bit)
            forceListen: boolean;      // Bit 15: Force listen
            talk: boolean;             // Bit 14: Talk enable
            listen: boolean;           // Bit 13: Listen enable
            holdToTalk: boolean;       // Bit 12: Hold to talk
            initialState: boolean;     // Bit 11: Initial state selected
            assignLocally: boolean;    // Bit 10: Assign locally enable
            assignRemotely: boolean;   // Bit 9: Assign remotely enable
            locallyAssigned: boolean;  // Bit 8: Currently locally assigned
        };
        guid: string;                  // Unique ECS GUID (16 bytes as hex string)
    };
}

// Type aliases for backward compatibility and clarity
export type LocallyAssignedKey = KeyConfiguration;
export type AssignedKey = KeyConfiguration;

// Common data structure for key collections
export interface KeyCollectionData {
    messageType: string;
    messageID: number;
    timestamp: string;
    slot: number;                      // Card slot number
    port: number;                      // Port offset from first port of card
    panelIdentifier: string;           // Human-readable panel identifier
    count: number;                     // Number of keys
    keys: KeyConfiguration[];          // Array of key configurations
    rawPayload: string;
}

// Specific data structures that extend the base
export interface LocallyAssignedKeysData extends KeyCollectionData {
    messageType: 'locallyAssignedKeys';
}

export interface AssignedKeysData extends KeyCollectionData {
    messageType: 'assignedKeys';
    schemaVersion: 1 | 2;             // Protocol schema version
    endpointType?: number;            // Endpoint type (Schema 2 only)
    endpointTypeName?: string;        // Human-readable endpoint type (Schema 2 only)
}