export const PANEL_TYPES: Record<number, string> = {
    0x8000: 'iStation',
    0x8008: 'ICS 1016',
    0x800E: 'ICS 1008',
    0x8010: 'V-Series 1U Lever',
    0x8011: 'V-Series 1U Push',
    0x8012: 'V-Series 2U Lever',
    0x8013: 'V-Series 2U Push',
    0x8014: 'V-Series Desk Lever',
    0x8015: 'V-Series Desk Push',
    0x8016: 'V-Series 1U Rotary',
    0x8019: 'V-Series 2U Rotary',
    0x801A: 'V-Series Desk Rotary',
    0x8020: 'V-Series 2U (32 Key)',
    0x8100: 'CCI-22',
    0x8102: 'FOR-22',
    0x8106: 'Tel-14/SIP',
    0x8110: 'LQ',
    0x8204: 'Edge Beltpacks'
};

export const getPanelTypeName = (panelType: number): string => {
    return PANEL_TYPES[panelType] || `Unknown Panel Type 0x${panelType.toString(16).padStart(4, '0')}`;
};

export const getPanelTypeFamily = (panelType: number): string => {
    if (panelType >= 0x8010 && panelType <= 0x8020) return 'V-Series';
    if (panelType >= 0x8100 && panelType <= 0x8110) return 'Desktop Panels';
    if (panelType === 0x8204) return 'Beltpack';
    if (panelType === 0x8000) return 'iStation';
    if (panelType === 0x8008 || panelType === 0x800E) return 'ICS Series';
    return 'Unknown';
};

export const isValidPanelType = (panelType: number): boolean => {
    return panelType in PANEL_TYPES;
};