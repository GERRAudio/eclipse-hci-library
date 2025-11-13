export const LATCH_MODES: Record<number, string> = {
    0: 'LATCH_NON_LATCH',
    1: 'LATCH',
    2: 'NON_LATCH',
    3: 'RETURN_AFTER_HOLD',
    4: 'TRI_ROT',
    5: 'TRI_TOG',
    6: 'RETURN_AFTER_LATCH',
    7: 'DEL_LATCH',
    8: 'HKS_LATCH'
};

export const getLatchModeName = (latchMode: number): string => {
    return LATCH_MODES[latchMode] || `Unknown Latch Mode ${latchMode}`;
};

export const getLatchModeDescription = (latchMode: number): string => {
    const descriptions: Record<number, string> = {
        0: 'Non-latching mode (momentary operation)',
        1: 'Latching mode (toggle on/off)',
        2: 'Non-latching mode (forced momentary)',
        3: 'Return after hold (release after hold time)',
        4: 'Tri-state rotary mode',
        5: 'Tri-state toggle mode',
        6: 'Return after latch (auto-release after latch)',
        7: 'Delayed latch mode',
        8: 'Hold key sequence latch mode'
    };

    return descriptions[latchMode] || `Unknown latch mode: ${latchMode}`;
};

export const isValidLatchMode = (latchMode: number): boolean => {
    return latchMode >= 0 && latchMode <= 8;
};

export const getAllLatchModes = (): Array<{ value: number; name: string; description: string }> => {
    return Object.entries(LATCH_MODES).map(([value, name]) => ({
        value: parseInt(value),
        name,
        description: getLatchModeDescription(parseInt(value))
    }));
};