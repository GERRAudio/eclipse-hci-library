export const ENTITY_TYPES: Record<number, string> = {
    1: 'EN_PORT',
    2: 'EN_GROUP',
    3: 'EN_TRUNK',
    4: 'EN_SPEED_DIAL',
    5: 'EN_IFB',
    6: 'EN_ISO',
    7: 'EN_CONFERENCE',
    8: 'EN_PAGE',
    9: 'EN_SYSTEM'
    // Add more entity types as needed
};

export const getEntityTypeName = (entityType: number): string => {
    return ENTITY_TYPES[entityType] || `Unknown Entity ${entityType}`;
};

export const getEntityTypeDescription = (entityType: number): string => {
    const descriptions: Record<number, string> = {
        1: 'Port entity - represents a communication port',
        2: 'Group entity - represents a talk group',
        3: 'Trunk entity - represents a trunk connection',
        4: 'Speed dial entity - represents a speed dial entry',
        5: 'IFB entity - represents an IFB (Interrupted Feedback) channel',
        6: 'ISO entity - represents an isolation channel',
        7: 'Conference entity - represents a conference channel',
        8: 'Page entity - represents a page/announce channel',
        9: 'System entity - represents a system function'
    };

    return descriptions[entityType] || `Unknown entity type: ${entityType}`;
};

export const isValidEntityType = (entityType: number): boolean => {
    return entityType in ENTITY_TYPES;
};

export const getAllEntityTypes = (): Array<{ value: number; name: string; description: string }> => {
    return Object.entries(ENTITY_TYPES).map(([value, name]) => ({
        value: parseInt(value),
        name,
        description: getEntityTypeDescription(parseInt(value))
    }));
};
