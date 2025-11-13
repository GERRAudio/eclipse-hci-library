export const EDIT_TYPES: Record<number, string> = {
    2: 'EN_CONF',      // Conference (partyline)
    3: 'GROUP'         // Fixed Group
};

// Edit Type Bit Masks
export const EDIT_TYPE_MASKS = {
    TALK: 0x01,           // Talk permission
    LISTEN: 0x02,         // Listen permission
    LOCAL_DELETED: 0x04,  // Locally deleted
    LOCAL_ASSIGNED: 0x08, // Locally assigned
    MAP_ASSIGNED: 0x10,   // Map assigned
    LOCAL_OVERRIDE: 0x20  // Local override
} as const;

export const getEditTypeName = (editType: number): string => {
    return EDIT_TYPES[editType] || `Unknown Edit Type ${editType}`;
};

export const getEditTypeDescription = (editType: number): string => {
    const descriptions: Record<number, string> = {
        2: 'Conference (partyline) - Request all locally edited conference members',
        3: 'Fixed Group - Request all locally edited fixed group members'
    };

    return descriptions[editType] || `Unknown edit type: ${editType}`;
};

export const parseEditTypeMask = (mask: number): {
    talk: boolean;
    listen: boolean;
    localDeleted: boolean;
    localAssigned: boolean;
    mapAssigned: boolean;
    localOverride: boolean;
} => {
    return {
        talk: (mask & EDIT_TYPE_MASKS.TALK) !== 0,
        listen: (mask & EDIT_TYPE_MASKS.LISTEN) !== 0,
        localDeleted: (mask & EDIT_TYPE_MASKS.LOCAL_DELETED) !== 0,
        localAssigned: (mask & EDIT_TYPE_MASKS.LOCAL_ASSIGNED) !== 0,
        mapAssigned: (mask & EDIT_TYPE_MASKS.MAP_ASSIGNED) !== 0,
        localOverride: (mask & EDIT_TYPE_MASKS.LOCAL_OVERRIDE) !== 0
    };
};

export const getEditTypeMaskDescription = (mask: number): string[] => {
    const descriptions: string[] = [];

    if (mask & EDIT_TYPE_MASKS.TALK) descriptions.push('Talk enabled');
    if (mask & EDIT_TYPE_MASKS.LISTEN) descriptions.push('Listen enabled');
    if (mask & EDIT_TYPE_MASKS.LOCAL_DELETED) descriptions.push('Locally deleted');
    if (mask & EDIT_TYPE_MASKS.LOCAL_ASSIGNED) descriptions.push('Locally assigned');
    if (mask & EDIT_TYPE_MASKS.MAP_ASSIGNED) descriptions.push('Map assigned');
    if (mask & EDIT_TYPE_MASKS.LOCAL_OVERRIDE) descriptions.push('Local override');

    return descriptions;
};

export const getEditTypeMaskIcon = (mask: number): string => {
    let icon = '';

    if (mask & EDIT_TYPE_MASKS.TALK) icon += '🗣️';
    if (mask & EDIT_TYPE_MASKS.LISTEN) icon += '👂';
    if (mask & EDIT_TYPE_MASKS.LOCAL_DELETED) icon += '🗑️';
    if (mask & EDIT_TYPE_MASKS.LOCAL_ASSIGNED) icon += '📌';
    if (mask & EDIT_TYPE_MASKS.MAP_ASSIGNED) icon += '🗺️';
    if (mask & EDIT_TYPE_MASKS.LOCAL_OVERRIDE) icon += '⚡';

    return icon || '⚫';
};

export const isValidEditType = (editType: number): boolean => {
    return editType === 2 || editType === 3;
};

export const isConferenceEditType = (editType: number): boolean => {
    return editType === 2;
};

export const isGroupEditType = (editType: number): boolean => {
    return editType === 3;
};

export const getAllEditTypes = (): Array<{ value: number; name: string; description: string }> => {
    return Object.entries(EDIT_TYPES).map(([value, name]) => ({
        value: parseInt(value),
        name,
        description: getEditTypeDescription(parseInt(value))
    }));
};