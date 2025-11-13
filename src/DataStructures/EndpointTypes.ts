export const ENDPOINT_TYPES: Record<number, string> = {
    0x8200: 'FS II Beltpack',
    0x8201: 'FS III Beltpack',
    0x8204: 'Edge Beltpack',
    // Add more endpoint types as needed
};

export const getEndpointTypeName = (endpointType: number): string => {
    return ENDPOINT_TYPES[endpointType] || `Unknown Endpoint Type 0x${endpointType.toString(16).padStart(4, '0')}`;
};

export const getEndpointTypeFamily = (endpointType: number): string => {
    if (endpointType >= 0x8200 && endpointType <= 0x8204) return 'Beltpack';
    return 'Unknown';
};

export const isValidEndpointType = (endpointType: number): boolean => {
    return endpointType in ENDPOINT_TYPES;
};