export const PORT_TYPES: Record<number, string> = {
    0: 'NULL',
    1: 'Beltpack',
    2: 'Wireless Port (E-IPA)',
    3: 'Transceiver (EQue)',
    4: 'EQue Direct',
    5: 'Speed Dial',
    6: 'FOR-22',
    8: 'PABX',
    10: 'Direct',
    11: 'EQue Trunk',
    14: 'Panel',
    18: 'Trunk (non EQue)',
    19: 'Tel-14/SIP',
    25: 'Fibre Trunk',
    27: 'EQue T1 Trunk',
    28: 'LMC',
    29: 'CCI-22',
    30: 'HelixNet',
    31: 'EQue Direct (T1/E1/E&M)'
};

export const getPortTypeName = (portType: number): string => {
    return PORT_TYPES[portType] || `Unknown Port Type ${portType}`;
};

export const getPortTypeCategory = (portType: number): string => {
    const categories: Record<number, string> = {
        0: 'Null',
        1: 'Beltpack',
        2: 'Wireless',
        3: 'Trunk',
        4: 'Trunk',
        5: 'Utility',
        6: 'Panel',
        8: 'Interface',
        10: 'Interface',
        11: 'Trunk',
        14: 'Panel',
        18: 'Trunk',
        19: 'Interface',
        25: 'Trunk',
        27: 'Trunk',
        28: 'Interface',
        29: 'Panel',
        30: 'Interface',
        31: 'Trunk'
    };

    return categories[portType] || 'Unknown';
};

export const isTrunkPort = (portType: number): boolean => {
    return getPortTypeCategory(portType) === 'Trunk';
};

export const isPanelPort = (portType: number): boolean => {
    return getPortTypeCategory(portType) === 'Panel';
};

export const isBeltpackPort = (portType: number): boolean => {
    return getPortTypeCategory(portType) === 'Beltpack';
};