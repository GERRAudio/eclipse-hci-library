export const EXPANSION_PANEL_TYPES: Record<number, string> = {
    0: 'Not set',
    1: 'Lever',
    2: 'Push',
    3: 'Rotary',
    4: '16 key lever (V32)'
};

export const getExpansionPanelTypeName = (expansionType: number): string => {
    return EXPANSION_PANEL_TYPES[expansionType] || `Unknown Type ${expansionType}`;
};

export const isValidExpansionPanelType = (expansionType: number): boolean => {
    return expansionType in EXPANSION_PANEL_TYPES;
};