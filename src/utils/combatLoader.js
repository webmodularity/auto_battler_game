import { createPublicClient, http, BaseError, ContractFunctionRevertedError } from 'viem';
import { CombatResultType, WinCondition, getEnumKeyByValue } from './combatDecoder';

const gameABI = [{
    name: 'practiceGame',
    type: 'function',
    stateMutability: 'view',
    inputs: [{
        name: 'player1',
        type: 'tuple',
        components: [
            { name: 'playerId', type: 'uint32' },
            { name: 'skinIndex', type: 'uint32' },
            { name: 'skinTokenId', type: 'uint16' }
        ]
    }, {
        name: 'player2',
        type: 'tuple',
        components: [
            { name: 'playerId', type: 'uint32' },
            { name: 'skinIndex', type: 'uint32' },
            { name: 'skinTokenId', type: 'uint16' }
        ]
    }],
    outputs: [{ name: '', type: 'bytes' }]
}, {
    name: 'gameEngine',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
}];

const gameEngineABI = [{
    name: 'decodeCombatLog',
    type: 'function',
    stateMutability: 'pure',
    inputs: [
        { name: 'results', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [
        { name: 'winningPlayerId', type: 'uint256', internalType: 'uint256' },  // Changed back to uint256
        { name: 'condition', type: 'uint8', internalType: 'enum GameEngine.WinCondition' },
        {
            name: 'actions',
            type: 'tuple[]',
            internalType: 'struct GameEngine.CombatAction[]',
            components: [
                { name: 'p1Result', type: 'uint8', internalType: 'enum GameEngine.CombatResultType' },
                { name: 'p1Damage', type: 'uint16', internalType: 'uint16' },
                { name: 'p1StaminaLost', type: 'uint8', internalType: 'uint8' },
                { name: 'p2Result', type: 'uint8', internalType: 'enum GameEngine.CombatResultType' },
                { name: 'p2Damage', type: 'uint16', internalType: 'uint16' },
                { name: 'p2StaminaLost', type: 'uint8', internalType: 'uint8' }
            ]
        }
    ]
}];

export async function loadCombatBytes(player1Id, player2Id) {
    try {
        const networkName = import.meta.env.VITE_ALCHEMY_NETWORK.toLowerCase();
        const transport = http(`https://${networkName}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`);
        const client = createPublicClient({
            transport
        });

        const gameEngineAddress = await client.readContract({
            address: import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: 'gameEngine'
        });

        const player1Loadout = {
            playerId: player1Id,
            skinIndex: 0,
            skinTokenId: player1Id
        };

        const player2Loadout = {
            playerId: player2Id,
            skinIndex: 0,
            skinTokenId: player2Id
        };

        // Get combat bytes
        const combatBytes = await client.readContract({
            address: import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: 'practiceGame',
            args: [player1Loadout, player2Loadout]
        });

        console.log('Combat Bytes:', combatBytes);

        // Decode using GameEngine - ensure combatBytes is a hex string
        const decodedCombat = await client.readContract({
            address: gameEngineAddress,
            abi: gameEngineABI,
            functionName: 'decodeCombatLog',
            args: [combatBytes]
        });


        // Extract actions array
        const actions = decodedCombat[2];
        
        // Map the actions with proper enum conversion
        const mappedActions = actions.map((action, index) => {
            // Convert numeric values to their enum string representations
            const p1ResultEnum = getEnumKeyByValue(CombatResultType, Number(action.p1Result));
            const p2ResultEnum = getEnumKeyByValue(CombatResultType, Number(action.p2Result));
            
            return {
                p1Result: p1ResultEnum,
                p1Damage: Number(action.p1Damage),
                p1StaminaLost: Number(action.p1StaminaLost),
                p2Result: p2ResultEnum,
                p2Damage: Number(action.p2Damage),
                p2StaminaLost: Number(action.p2StaminaLost)
            };
        });

        const result = {
            winner: Number(decodedCombat[0]),
            condition: getEnumKeyByValue(WinCondition, Number(decodedCombat[1])),
            actions: mappedActions
        };
        
        // Verify the result has the expected structure
        if (!result.actions || result.actions.length === 0) {
            throw new Error('No actions in processed result');
        }

        return result;

    } catch (error) {
        console.error('Error loading combat bytes:', error);
        throw error;
    }
}