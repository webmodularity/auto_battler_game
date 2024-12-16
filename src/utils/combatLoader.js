import { createPublicClient, http, BaseError, ContractFunctionRevertedError } from 'viem';
import { CombatResultType, WinCondition, getEnumKeyByValue } from './combatDecoder';
import { mainnet } from 'viem/chains';
import { PracticeGameABI, GameEngineABI } from '../abi';

export async function loadCombatBytes(player1Id, player2Id) {
    try {
        const networkName = import.meta.env.VITE_ALCHEMY_NETWORK.toLowerCase();
        const transport = http(`https://${networkName}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`);
        const client = createPublicClient({
            chain: mainnet,
            transport
        });

        const gameEngineAddress = await client.readContract({
            address: import.meta.env.VITE_PRACTICE_GAME_CONTRACT_ADDRESS,
            abi: PracticeGameABI,
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
            address: import.meta.env.VITE_PRACTICE_GAME_CONTRACT_ADDRESS,
            abi: PracticeGameABI,
            functionName: 'play',
            args: [player1Loadout, player2Loadout]
        });

        console.log('Combat Bytes:', combatBytes);

        // Decode using GameEngine - ensure combatBytes is a hex string
        const decodedCombat = await client.readContract({
            address: gameEngineAddress,
            abi: GameEngineABI,
            functionName: 'decodeCombatLog',
            args: [combatBytes]
        });

        console.log('Decoded Combat:', decodedCombat);

        // Extract actions array - skip gameEngineVersion which is at index 1
        const actions = decodedCombat[3];
        
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
            condition: getEnumKeyByValue(WinCondition, Number(decodedCombat[2])), // condition is at index 2 now
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