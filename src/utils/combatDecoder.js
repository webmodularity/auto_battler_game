// Enums matching the Solidity contract exactly
const CombatResultType = {
    MISS: 0,
    ATTACK: 1,
    CRIT: 2,
    BLOCK: 3,
    COUNTER: 4,
    COUNTER_CRIT: 5,
    DODGE: 6,
    PARRY: 7,
    RIPOSTE: 8,
    RIPOSTE_CRIT: 9,
    EXHAUSTED: 10,
    HIT: 11
};

const WinCondition = {
    HEALTH: 0,
    EXHAUSTION: 1,
    MAX_ROUNDS: 2
};

const MAX_ROUNDS = 50;

// Utility function to get enum key by value
function getEnumKeyByValue(enumObj, value) {
    return Object.keys(enumObj).find(key => enumObj[key] === value);
}

export {
    CombatResultType,
    WinCondition,
    MAX_ROUNDS,
    getEnumKeyByValue
}; 