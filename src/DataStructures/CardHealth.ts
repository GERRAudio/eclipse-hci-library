export const CARD_HEALTH: Record<number, string> = {
    0: 'PCB_GOOD',
    1: 'PCB_ABSENT',
    2: 'PCB_FAULTY',
    3: 'PCB_DETECTED',
    4: 'PCB_WAITING',
    5: 'PCB_MISFIT',
    6: 'PCB_POWERINGUP',
    7: 'PCB_INITIALISING',
    8: 'PCB_SUSPECT',
    9: 'PCB_UNTESTED'
};

export const getCardHealthName = (health: number): string => {
    return CARD_HEALTH[health] || `Unknown Health ${health}`;
};

export const getCardHealthDescription = (health: number): string => {
    const descriptions: Record<number, string> = {
        0: 'Correct type fitted and believed working',
        1: 'Cannot detect any card',
        2: 'Correct card believed busted permanently',
        3: 'Card detected but slot ID not yet stable',
        4: 'Correct card first/later found in need of initialization',
        5: 'Detected wrong type of card',
        6: 'Correct card only just inserted, considered not yet stable',
        7: 'Correct card stable for ready state to be checked',
        8: 'Correct card failed some tests but maybe still usable',
        9: 'Not yet tested – this is only used for FRM channels'
    };

    return descriptions[health] || `Unknown card health: ${health}`;
};

export const getCardHealthIcon = (health: number): string => {
    const icons: Record<number, string> = {
        0: '✅',  // PCB_GOOD
        1: '❌',  // PCB_ABSENT
        2: '💀',  // PCB_FAULTY
        3: '🔍',  // PCB_DETECTED
        4: '⏳',  // PCB_WAITING
        5: '❌',  // PCB_MISFIT
        6: '🔄',  // PCB_POWERINGUP
        7: '🔧',  // PCB_INITIALISING
        8: '⚠️',  // PCB_SUSPECT
        9: '❓'   // PCB_UNTESTED
    };

    return icons[health] || '❓';
};

export const isCardHealthy = (health: number): boolean => {
    return health === 0; // PCB_GOOD
};

export const isCardFaulty = (health: number): boolean => {
    return health === 1 || health === 2 || health === 5; // ABSENT, FAULTY, MISFIT
};

export const isCardInitializing = (health: number): boolean => {
    return health === 3 || health === 4 || health === 6 || health === 7; // Various init states
};

export const getCardHealthSeverity = (health: number): 'good' | 'warning' | 'error' | 'info' => {
    if (health === 0) return 'good';
    if (health === 1 || health === 2 || health === 5) return 'error';
    if (health === 8) return 'warning';
    return 'info'; // Initializing states
};

export const isValidCardHealth = (health: number): boolean => {
    return health >= 0 && health <= 9;
};

export const getAllCardHealthStates = (): Array<{ value: number; name: string; description: string; severity: string }> => {
    return Object.entries(CARD_HEALTH).map(([value, name]) => ({
        value: parseInt(value),
        name,
        description: getCardHealthDescription(parseInt(value)),
        severity: getCardHealthSeverity(parseInt(value))
    }));
};