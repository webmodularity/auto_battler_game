import { Alchemy, Network } from 'alchemy-sdk';
import { createPublicClient, http, parseAbiItem } from 'viem';

// ABI for the player contract including skinRegistry and calculateStats
const playerABI = [{
    name: 'getPlayer',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'playerId', type: 'uint256' }],
    outputs: [{
        type: 'tuple',
        components: [
            { name: 'strength', type: 'uint8' },
            { name: 'constitution', type: 'uint8' },
            { name: 'size', type: 'uint8' },
            { name: 'agility', type: 'uint8' },
            { name: 'stamina', type: 'uint8' },
            { name: 'luck', type: 'uint8' },
            { name: 'skinIndex', type: 'uint32' },
            { name: 'skinTokenId', type: 'uint16' },
            { name: 'firstNameIndex', type: 'uint16' },
            { name: 'surnameIndex', type: 'uint16' }
        ]
    }]
}, {
    name: 'skinRegistry',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
}, {
    name: 'nameRegistry',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
}, {
    name: 'calculateStats',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{
        name: 'player',
        type: 'tuple',
        components: [
            { name: 'strength', type: 'uint8' },
            { name: 'constitution', type: 'uint8' },
            { name: 'size', type: 'uint8' },
            { name: 'agility', type: 'uint8' },
            { name: 'stamina', type: 'uint8' },
            { name: 'luck', type: 'uint8' },
            { name: 'skinIndex', type: 'uint32' },
            { name: 'skinTokenId', type: 'uint16' },
            { name: 'firstNameIndex', type: 'uint16' },
            { name: 'surnameIndex', type: 'uint16' }
        ]
    }],
    outputs: [{
        type: 'tuple',
        components: [
            { name: 'maxHealth', type: 'uint16' },
            { name: 'damageModifier', type: 'uint16' },
            { name: 'hitChance', type: 'uint16' },
            { name: 'blockChance', type: 'uint16' },
            { name: 'dodgeChance', type: 'uint16' },
            { name: 'maxEndurance', type: 'uint16' },
            { name: 'critChance', type: 'uint16' },
            { name: 'initiative', type: 'uint16' },
            { name: 'counterChance', type: 'uint16' },
            { name: 'critMultiplier', type: 'uint16' },
            { name: 'parryChance', type: 'uint16' }
        ]
    }]
}];

// ABI for the skin registry's getSkin function
const skinRegistryABI = [{
    name: 'getSkin',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint32' }],
    outputs: [{
        type: 'tuple',
        components: [
            { name: 'contractAddress', type: 'address' },
            { name: 'isVerified', type: 'bool' },
            { name: 'isDefaultCollection', type: 'bool' },
            { name: 'requiredNFTAddress', type: 'address' }
        ]
    }]
}];

// Add ABI for ERC721 tokenURI method
const erc721ABI = [{
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }]
}];

// Add new ABI at the top with other ABIs
const gameABI = [{
    name: 'playerContract',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
}];

// Simplified ABI for debugging
const nameRegistryABI = [{
    type: 'function',
    name: 'getFullName',
    inputs: [
        { type: 'uint16', name: 'firstNameIndex' },
        { type: 'uint16', name: 'surnameIndex' }
    ],
    outputs: [
        { type: 'string', name: 'firstName' },
        { type: 'string', name: 'surname' }
    ],
    stateMutability: 'view'
}];

// Format network name for URL (e.g., "shape-sepolia" -> "shape-sepolia")
const getAlchemyNetwork = (networkName) => {
    return networkName.toLowerCase(); // ensure lowercase
};

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
        const gameContractAddress = import.meta.env.VITE_GAME_CONTRACT_ADDRESS;
        const playerContractAddress = await client.readContract({
            address: gameContractAddress,
            abi: gameABI,
            functionName: 'playerContract'
        });

        // Get name registry address from player contract
        const nameRegistryAddress = await client.readContract({
            address: playerContractAddress,
            abi: playerABI,
            functionName: 'nameRegistry'
        });

        // Get player stats
        const playerStats = await client.readContract({
            address: playerContractAddress,
            abi: playerABI,
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
            abi: nameRegistryABI,
            functionName: 'getFullName',
            args: [playerStats.firstNameIndex, playerStats.surnameIndex]
        });

        console.log('Player Name Result:', playerName);

        // After getting playerStats, calculate the derived stats
        const calculatedStats = await client.readContract({
            address: playerContractAddress,
            abi: playerABI,
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
                surnameIndex: playerStats.surnameIndex
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
            abi: playerABI,
            functionName: 'skinRegistry'
        });

        // Get skin info
        const skinInfo = await client.readContract({
            address: skinRegistryAddress,
            abi: skinRegistryABI,
            functionName: 'getSkin',
            args: [playerStats.skinIndex]
        });

        // Get NFT metadata
        const tokenURI = await client.readContract({
            address: skinInfo.contractAddress,
            abi: erc721ABI,
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
        console.error('Name Registry Error:', {
            error,
            abi: nameRegistryABI,
            functionSignature: 'getFullName(uint16,uint16)'
        });
        throw error;
    }
} 