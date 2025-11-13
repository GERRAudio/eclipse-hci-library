export const KEY_STATES: Record<number, string> = {
    0: 'OFF',
    1: 'ON',
    2: 'PARTIAL',
    3: 'RESERVED'
};

export const getKeyStateName = (keyState: number): string => {
    return KEY_STATES[keyState] || `Unknown State ${keyState}`;
};

export const getKeyStateDescription = (keyState: number): string => {
    const descriptions: Record<number, string> = {
        0: 'Key is in OFF state (inactive)',
        1: 'Key is in ON state (active)',
        2: 'Key is in PARTIAL state (partially active)',
        3: 'Key state is RESERVED (special state)'
    };

    return descriptions[keyState] || `Unknown key state: ${keyState}`;
};

export const isValidKeyState = (keyState: number): boolean => {
    return keyState >= 0 && keyState <= 3;
};

export const getAllKeyStates = (): Array<{ value: number; name: string; description: string }> => {
    return Object.entries(KEY_STATES).map(([value, name]) => ({
        value: parseInt(value),
        name,
        description: getKeyStateDescription(parseInt(value))
    }));
};

// Key state helpers
export const isKeyActive = (keyState: number): boolean => {
    return keyState === 1 || keyState === 2;
};

export const isKeyInactive = (keyState: number): boolean => {
    return keyState === 0;
};

export const getKeyStateIcon = (keyState: number): string => {
    const icons: Record<number, string> = {
        0: '⚫',  // OFF
        1: '🔴',  // ON
        2: '🟡',  // PARTIAL
        3: '⚪'   // RESERVED
    };

    return icons[keyState] || '❓';
};