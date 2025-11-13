export const CARD_TYPES: Record<number, string> = {
    0: 'UNKNOWN',
    1: 'CPUMASTER',
    2: 'CPUSLAVE',
    3: 'MVX',
    4: 'MADI',
    26: 'FIBRE',
    27: 'EQUE/IVC32/LMC64'
};

export const getCardTypeName = (cardType: number): string => {
    return CARD_TYPES[cardType] || `Unknown Card Type ${cardType}`;
};

export const getCardTypeDescription = (cardType: number): string => {
    const descriptions: Record<number, string> = {
        0: 'Unknown card type',
        1: 'CPU Master card - primary processing unit',
        2: 'CPU Slave card - secondary processing unit',
        3: 'MVX card - audio matrix card',
        4: 'MADI card - Multichannel Audio Digital Interface',
        26: 'Fibre card - fiber optic interface',
        27: 'EQUE/IVC32/LMC64 card - communication interface'
    };

    return descriptions[cardType] || `Unknown card type: ${cardType}`;
};

export const getCardTypeCategory = (cardType: number): string => {
    const categories: Record<number, string> = {
        0: 'Unknown',
        1: 'Processing',
        2: 'Processing',
        3: 'Audio',
        4: 'Audio',
        26: 'Interface',
        27: 'Interface'
    };

    return categories[cardType] || 'Unknown';
};

export const isValidCardType = (cardType: number): boolean => {
    return cardType in CARD_TYPES;
};

export const isCPUCard = (cardType: number): boolean => {
    return cardType === 1 || cardType === 2;
};

export const isAudioCard = (cardType: number): boolean => {
    return cardType === 3 || cardType === 4;
};

export const isInterfaceCard = (cardType: number): boolean => {
    return cardType === 26 || cardType === 27;
};

export const getAllCardTypes = (): Array<{ value: number; name: string; description: string; category: string }> => {
    return Object.entries(CARD_TYPES).map(([value, name]) => ({
        value: parseInt(value),
        name,
        description: getCardTypeDescription(parseInt(value)),
        category: getCardTypeCategory(parseInt(value))
    }));
};

export const getCardTypePriority = (cardType: number): 'critical' | 'high' | 'normal' => {
    if (isCPUCard(cardType)) return 'critical';
    if (isAudioCard(cardType)) return 'high';
    return 'normal';
};