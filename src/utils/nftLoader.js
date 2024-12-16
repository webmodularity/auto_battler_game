import { Alchemy, Network } from 'alchemy-sdk';
import { createPublicClient, http, parseAbiItem, keccak256 as viemKeccak256, toHex } from 'viem';
import { PlayerABI, SkinRegistryABI, ERC721ABI, PracticeGameABI, NameRegistryABI } from '../abi';

const settings = {
    apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
    network: import.meta.env.VITE_ALCHEMY_NETWORK
};

const alchemy = new Alchemy(settings);

export async function loadCharacterData(playerId) {
    try {
        const networkName = getAlchemyNetwork(settings.network);
        
        const transport = http(`https://${networkName}.g.alchemy.com/v2/${settings.apiKey}`);
        const client = createPublicClient({
            transport
        });

        // Get player contract address from game contract first
        const gameContractAddress = import.meta.env.VITE_PRACTICE_GAME_CONTRACT_ADDRESS;
        const playerContractAddress = await client.readContract({
            address: gameContractAddress,
            abi: PracticeGameABI,
            functionName: 'playerContract'
        });

        // Get name registry address from player contract
        const nameRegistryAddress = await client.readContract({
            address: playerContractAddress,
            abi: PlayerABI,
            functionName: 'nameRegistry'
        });

        // Get player stats
        const playerStats = await client.readContract({
            address: playerContractAddress,
            abi: PlayerABI,
            functionName: 'getPlayer',
            args: [BigInt(playerId)]
        });

        // Add debug logging
        console.log('Name Registry Call Details:', {
            address: nameRegistryAddress,
            firstNameIndex: playerStats.firstNameIndex,
            surnameIndex: playerStats.surnameIndex
        });

        const playerName = await client.readContract({
            address: nameRegistryAddress,
            abi: NameRegistryABI,
            functionName: 'getFullName',
            args: [playerStats.firstNameIndex, playerStats.surnameIndex]
        });

        console.log('Player Name Result:', playerName);

        // After getting playerStats, calculate the derived stats
        const calculatedStats = await client.readContract({
            address: playerContractAddress,
            abi: PlayerABI,
            functionName: 'calculateStats',
            args: [{
                strength: playerStats.strength,
                constitution: playerStats.constitution,
                size: playerStats.size,
                agility: playerStats.agility,
                stamina: playerStats.stamina,
                luck: playerStats.luck,
                skinIndex: playerStats.skinIndex,
                skinTokenId: playerStats.skinTokenId,
                firstNameIndex: playerStats.firstNameIndex,
                surnameIndex: playerStats.surnameIndex,
                wins: playerStats.wins,
                losses: playerStats.losses,
                kills: playerStats.kills
            }]
        });

        console.log('Player Stats:', {
            baseStats: {
                strength: playerStats.strength,
                constitution: playerStats.constitution,
                size: playerStats.size,
                agility: playerStats.agility,
                stamina: playerStats.stamina,
                luck: playerStats.luck
            },
            calculatedStats: {
                maxHealth: Number(calculatedStats.maxHealth),
                maxEndurance: Number(calculatedStats.maxEndurance),
                damageModifier: Number(calculatedStats.damageModifier),
                hitChance: Number(calculatedStats.hitChance),
                blockChance: Number(calculatedStats.blockChance),
                dodgeChance: Number(calculatedStats.dodgeChance),
                critChance: Number(calculatedStats.critChance)
            }
        });

        // Create stats object with both base and calculated stats
        const stats = {
            // Base stats
            strength: Number(playerStats.strength),
            constitution: Number(playerStats.constitution),
            size: Number(playerStats.size),
            agility: Number(playerStats.agility),
            stamina: Number(playerStats.stamina),
            luck: Number(playerStats.luck),
            skinIndex: Number(playerStats.skinIndex),
            skinTokenId: Number(playerStats.skinTokenId),
            firstNameIndex: Number(playerStats.firstNameIndex),
            surnameIndex: Number(playerStats.surnameIndex),
            wins: Number(playerStats.wins),
            losses: Number(playerStats.losses),
            kills: Number(playerStats.kills),
            // Calculated stats
            maxHealth: Number(calculatedStats.maxHealth),
            maxEndurance: Number(calculatedStats.maxEndurance),
            damageModifier: Number(calculatedStats.damageModifier),
            hitChance: Number(calculatedStats.hitChance),
            blockChance: Number(calculatedStats.blockChance),
            dodgeChance: Number(calculatedStats.dodgeChance),
            critChance: Number(calculatedStats.critChance),
            initiative: Number(calculatedStats.initiative),
            counterChance: Number(calculatedStats.counterChance),
            critMultiplier: Number(calculatedStats.critMultiplier),
            parryChance: Number(calculatedStats.parryChance)
        };

        // Update skin registry call with new address
        const skinRegistryAddress = await client.readContract({
            address: playerContractAddress,
            abi: PlayerABI,
            functionName: 'skinRegistry'
        });

        // Get skin info
        const skinInfo = await client.readContract({
            address: skinRegistryAddress,
            abi: SkinRegistryABI,
            functionName: 'getSkin',
            args: [playerStats.skinIndex]
        });

        // Get NFT metadata
        const tokenURI = await client.readContract({
            address: skinInfo.contractAddress,
            abi: ERC721ABI,
            functionName: 'tokenURI',
            args: [BigInt(playerStats.skinTokenId)]
        });

        let metadata;
        try {
            if (tokenURI.startsWith('ipfs://')) {
                const ipfsHash = tokenURI.replace('ipfs://', '');
                const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
                const response = await fetch(ipfsUrl);
                const rawText = await response.text();
                metadata = JSON.parse(rawText);
                
                let spritesheetUrl = metadata.image_spritesheet;
                if (spritesheetUrl && spritesheetUrl.startsWith('ipfs://')) {
                    spritesheetUrl = spritesheetUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }

                return {
                    stats,
                    nftContractAddress: skinInfo.contractAddress,
                    spritesheetUrl,
                    jsonData: metadata,
                    name: {
                        firstName: playerName[0],
                        surname: playerName[1],
                        fullName: `${playerName[0]} ${playerName[1]}`
                    }
                };
            } else {
                const response = await fetch(tokenURI);
                const rawText = await response.text();
                metadata = JSON.parse(rawText);
            }

            // Convert IPFS spritesheet URL to HTTP URL if needed
            let spritesheetUrl = metadata.image_spritesheet;
            if (spritesheetUrl && spritesheetUrl.startsWith('ipfs://')) {
                spritesheetUrl = spritesheetUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            return {
                stats,
                nftContractAddress: skinInfo.contractAddress,
                spritesheetUrl,
                jsonData: metadata,
                name: {
                    firstName: playerName[0],
                    surname: playerName[1],
                    fullName: `${playerName[0]} ${playerName[1]}`
                }
            };

        } catch (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error loading character data:', {
            playerId,
            error: error.message,
            networkName: settings.network,
            stack: error.stack
        });
        throw new Error(`Failed to load character data for player ${playerId}: ${error.message}`);
    }
} 

export async function loadDuelDataFromTx(txHash, network) {
    console.log('Loading duel data for tx:', txHash, 'network:', network);
    const alchemy = new Alchemy({
        apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
        network: network
    });

    try {
        // Get the transaction receipt
        const receipt = await alchemy.core.getTransactionReceipt(txHash);
        console.log('Transaction receipt:', receipt);
        
        // The event we're looking for is CombatResult(uint32,uint32,uint32,bytes)
        // We need to decode this from the logs
        const combatResultTopic = viemKeccak256(
            toHex('CombatResult(uint32,uint32,uint32,bytes)')
        );
        console.log('Combat result topic:', combatResultTopic);
        
        // Find the relevant log
        const combatLog = receipt.logs.find(log => {
            console.log('Checking log:', log);
            console.log('Log topic 0:', log.topics[0]);
            console.log('Expected topic:', combatResultTopic);
            return log.topics[0] === combatResultTopic;
        });
        console.log('Combat log:', combatLog);
        
        if (!combatLog) {
            throw new Error('Combat result log not found in transaction');
        }

        // Decode the log data
        // topics[1] = player1Id (indexed)
        // topics[2] = player2Id (indexed)
        // topics[3] = winningPlayerId (indexed)
        // data = packed combat results (bytes)
        const player1Id = parseInt(combatLog.topics[1], 16);
        const player2Id = parseInt(combatLog.topics[2], 16);
        const winningPlayerId = parseInt(combatLog.topics[3], 16);
        
        // Extract combat bytes from data:
        // - first 32 bytes (64 chars): offset
        // - next 32 bytes (64 chars): length of bytes
        // - remaining: actual bytes data
        const rawData = combatLog.data.slice(2); // remove '0x' prefix
        const combatBytes = '0x' + rawData.slice(128); // Skip first 128 chars (64 bytes) of metadata

        const result = {
            player1Id,
            player2Id,
            winningPlayerId,
            combatBytes
        };
        console.log('Decoded duel data:', result);
        return result;
    } catch (error) {
        console.error('Error loading duel data:', error);
        throw error;
    }
}

// Format network name for URL (e.g., "shape-sepolia" -> "shape-sepolia")
const getAlchemyNetwork = (networkName) => {
    return networkName.toLowerCase(); // ensure lowercase
};