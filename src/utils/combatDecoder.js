import { decodeEventLog } from 'viem';

// Enums matching the Solidity contract exactly
const CombatResultType = {
    MISS: 0,
    ATTACK: 1,
    BLOCK: 2,
    COUNTER: 3,
    DODGE: 4,
    HIT: 5
};

const WinCondition = {
    HEALTH: 0,    // Won by reducing opponent's health to 0
    EXHAUSTION: 1, // Won because opponent couldn't attack (low stamina)
    MAX_ROUNDS: 2  // Won by having more health after max rounds
};

// Constants matching the contract
const STAMINA_ATTACK = 10;
const STAMINA_BLOCK = 12;
const STAMINA_DODGE = 8;
const STAMINA_COUNTER = 15;
const MAX_ROUNDS = 50;

// Create ABI fragment for the combat event
const combatAbi = [{
    type: 'event',
    name: 'CombatResult',
    inputs: [
        { type: 'uint8', name: 'winner', indexed: false },
        { type: 'uint8', name: 'condition', indexed: false },
        { type: 'bytes', name: 'actions', indexed: false }
    ]
}];

function decodeCombatLog(results) {
    // Remove 0x prefix if present
    const hexString = results.startsWith('0x') ? results.slice(2) : results;
    
    // Convert hex string to bytes array
    const bytes = new Uint8Array(
        hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    if (bytes.length < 2) throw new Error("Results too short");

    // Extract winner and condition from first two bytes
    const winner = bytes[0];
    const condition = bytes[1];

    // Decode remaining combat actions
    const numActions = Math.floor((bytes.length - 2) / 8);
    const actions = [];

    for (let i = 0; i < numActions; i++) {
        const offset = 2 + (i * 8);
        
        // First cast to uint16 before shifting to prevent overflow
        const p1DamageHigh = bytes[offset + 1] & 0xFF;  // ensure unsigned 8-bit
        const p1DamageLow = bytes[offset + 2] & 0xFF;   // ensure unsigned 8-bit
        const p2DamageHigh = bytes[offset + 5] & 0xFF;  // ensure unsigned 8-bit
        const p2DamageLow = bytes[offset + 6] & 0xFF;   // ensure unsigned 8-bit
        
        actions.push({
            p1Result: bytes[offset],
            p1Damage: ((p1DamageHigh << 8) | p1DamageLow) & 0xFFFF,  // ensure unsigned 16-bit
            p1StaminaLost: bytes[offset + 3],
            p2Result: bytes[offset + 4],
            p2Damage: ((p2DamageHigh << 8) | p2DamageLow) & 0xFFFF,  // ensure unsigned 16-bit
            p2StaminaLost: bytes[offset + 7]
        });
    }

    // Helper function to get enum key from value
    const getEnumKeyByValue = (enumObj, value) => {
        return Object.keys(enumObj).find(key => enumObj[key] === value) || 'UNKNOWN';
    };

    return {
        winner,
        condition: getEnumKeyByValue(WinCondition, condition),
        actions: actions.map(action => ({
            p1Result: getEnumKeyByValue(CombatResultType, action.p1Result),
            p1Damage: action.p1Damage,
            p1StaminaLost: action.p1StaminaLost,
            p2Result: getEnumKeyByValue(CombatResultType, action.p2Result),
            p2Damage: action.p2Damage,
            p2StaminaLost: action.p2StaminaLost
        }))
    };
}

export { 
    decodeCombatLog, 
    WinCondition, 
    CombatResultType,
    STAMINA_ATTACK,
    STAMINA_BLOCK,
    STAMINA_DODGE,
    STAMINA_COUNTER,
    MAX_ROUNDS
}; 