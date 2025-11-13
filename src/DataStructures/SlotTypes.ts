export const SLOT_TYPES: Record<number, string> = {
    0: 'NO_SLOT',
    1: 'CPU_SLOT',
    2: 'DCC_SLOT',
    3: 'AUDIO_SLOT'
};

export const getSlotTypeName = (slotType: number): string => {
    return SLOT_TYPES[slotType] || `Unknown Slot Type ${slotType}`;
};

export const getSlotTypeDescription = (slotType: number): string => {
    const descriptions: Record<number, string> = {
        0: 'No slot - empty position',
        1: 'CPU slot - contains processing unit',
        2: 'DCC slot - Digital Control Card slot',
        3: 'Audio slot - Audio processing card slot'
    };

    return descriptions[slotType] || `Unknown slot type: ${slotType}`;
};

export const isValidSlotType = (slotType: number): boolean => {
    return slotType >= 0 && slotType <= 3;
};

export const isCPUSlot = (slotType: number): boolean => {
    return slotType === 1;
};

export const isAudioSlot = (slotType: number): boolean => {
    return slotType === 3;
};

export const isDCCSlot = (slotType: number): boolean => {
    return slotType === 2;
};

export const isEmptySlot = (slotType: number): boolean => {
    return slotType === 0;
};

export const getAllSlotTypes = (): Array<{ value: number; name: string; description: string }> => {
    return Object.entries(SLOT_TYPES).map(([value, name]) => ({
        value: parseInt(value),
        name,
        description: getSlotTypeDescription(parseInt(value))
    }));
};