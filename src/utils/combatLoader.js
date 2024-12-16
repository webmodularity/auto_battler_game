import { createPublicClient, http, parseEventLogs } from 'viem';
import { CombatResultType, WinCondition, getEnumKeyByValue } from './combatDecoder';
import { mainnet } from 'viem/chains';
import { PracticeGameABI, GameEngineABI, PlayerABI, DuelGameABI } from '../abi';
import { keccak256 as viemKeccak256, toHex } from 'viem';
import { Alchemy } from 'alchemy-sdk';

// Helper function to decode combat bytes into actions
async function decodeCombatBytes(bytes, network) {
    console.log('Decoding combat bytes:', bytes);
    const transport = http(`https://${network}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`);
    const client = createPublicClient({
        transport
    });

    const gameContractAddress = import.meta.env.VITE_PRACTICE_GAME_CONTRACT_ADDRESS;
    console.log('Game contract address:', gameContractAddress);
    
    const gameEngineAddress = await client.readContract({
        address: gameContractAddress,
        abi: PracticeGameABI,
        functionName: 'gameEngine'
    });
    console.log('Game engine address:', gameEngineAddress);

    // Decode combat log using game engine
    const decodedCombat = await client.readContract({
        address: gameEngineAddress,
        abi: GameEngineABI,
        functionName: 'decodeCombatLog',
        args: [bytes]
    });
    console.log('Decoded combat:', decodedCombat);

    // Extract actions array - skip gameEngineVersion which is at index 1
    const actions = decodedCombat[3];
    console.log('Raw actions:', actions);
    
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
    console.log('Mapped actions:', mappedActions);

    return {
        winner: Number(decodedCombat[0]),
        condition: getEnumKeyByValue(WinCondition, Number(decodedCombat[2])), // condition is at index 2 now
        actions: mappedActions
    };
}

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

export async function loadDuelDataFromTx(txId, network) {
    try {
        console.log('Loading duel data for:', txId, 'network:', network);
        const transport = http(`https://${network}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`);
        const client = createPublicClient({
            transport
        });

        // Get transaction receipt
        const receipt = await client.getTransactionReceipt({hash: txId});
        console.log('Transaction receipt:', receipt);

        // Parse the combat result event logs using DuelGameABI
        const parsedLogs = parseEventLogs({
            abi: DuelGameABI,
            eventName: 'CombatResult',
            logs: receipt.logs
        });
        console.log('Parsed logs:', parsedLogs);

        if (!parsedLogs || parsedLogs.length === 0) {
            throw new Error('Combat result log not found');
        }

        const combatLog = parsedLogs[0];
        console.log('Combat log:', combatLog);

        const player1Data = combatLog.args.player1Data;
        const player2Data = combatLog.args.player2Data;
        const winningPlayerId = combatLog.args.winningPlayerId;
        const packedResults = combatLog.args.packedResults;

        // Get player contract to decode player data
        const gameContractAddress = import.meta.env.VITE_DUEL_GAME_CONTRACT_ADDRESS;
        const playerContractAddress = await client.readContract({
            address: gameContractAddress,
            abi: DuelGameABI,
            functionName: 'playerContract'
        });

        // Decode player data from indexed parameters
        const [player1Id, player1Stats] = await client.readContract({
            address: playerContractAddress,
            abi: PlayerABI,
            functionName: 'decodePlayerData',
            args: [player1Data]
        });
        const [player2Id, player2Stats] = await client.readContract({
            address: playerContractAddress,
            abi: PlayerABI,
            functionName: 'decodePlayerData',
            args: [player2Data]
        });

        // Get game engine address
        const gameEngineAddress = await client.readContract({
            address: gameContractAddress,
            abi: DuelGameABI,
            functionName: 'gameEngine'
        });

        // Decode combat bytes
        const decodedCombat = await client.readContract({
            address: gameEngineAddress,
            abi: GameEngineABI,
            functionName: 'decodeCombatLog',
            args: [packedResults]
        });

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
            condition: getEnumKeyByValue(WinCondition, Number(decodedCombat[2])), // condition is at index 2
            actions: mappedActions,
            player1Id: Number(player1Id),
            player2Id: Number(player2Id),
            player1Stats,
            player2Stats,
            winningPlayerId
        };

        // Verify the result has the expected structure
        if (!result.actions || result.actions.length === 0) {
            console.error('No actions in processed result:', result);
            throw new Error('No actions in processed result');
        }

        console.log('Decoded duel data:', result);
        return result;

    } catch (error) {
        console.error('Error loading duel data:', error);
        throw error;
    }
}