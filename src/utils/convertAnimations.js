#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Maximum allowed duration for any animation (in seconds)
const MAX_ANIMATION_DURATION = 3;

// Animation name mappings (case-insensitive)
const ANIMATION_MAPPINGS = {
    'kicking': 'blocking',
    'slashing': 'attacking',
    'sliding': 'dodging'
};

// Default FPS values and validation rules
const ANIMATION_RULES = {
    idle: { fps: 24, maxDuration: 3 },
    walking: { fps: 24, maxDuration: 3 },
    running: { fps: 24, maxDuration: 3 },
    attacking: { fps: 24, maxDuration: 2 },
    blocking: { fps: 24, maxDuration: 2 },
    dying: { fps: 24, maxDuration: 3 },
    hurt: { fps: 24, maxDuration: 2 },
    dodging: { fps: 24, maxDuration: 2 }
};

function validateAnimation(animName, frameCount, fps) {
    const duration = frameCount / fps;
    const rules = ANIMATION_RULES[animName.toLowerCase()];
    
    if (!rules) {
        throw new Error(`Unknown animation type: ${animName}`);
    }

    const maxDuration = rules.maxDuration || MAX_ANIMATION_DURATION;
    
    if (duration > maxDuration) {
        throw new Error(
            `Animation "${animName}" exceeds maximum duration:\n` +
            `  Frames: ${frameCount}\n` +
            `  FPS: ${fps}\n` +
            `  Duration: ${duration.toFixed(2)}s\n` +
            `  Max Allowed: ${maxDuration}s`
        );
    }

    return true;
}

function convertFilename(filename) {
    // Extract animation name and frame number
    const match = filename.match(/^([A-Za-z]+)_(\d+)\.png$/);
    if (!match) return filename;

    const [, animName, frameNum] = match;
    
    // Check if this animation needs to be renamed (case-insensitive)
    const lowerAnimName = animName.toLowerCase();
    for (const [oldName, newName] of Object.entries(ANIMATION_MAPPINGS)) {
        if (lowerAnimName === oldName.toLowerCase()) {
            // Preserve original capitalization style
            const isFirstCapital = animName[0] === animName[0].toUpperCase();
            const newAnimName = isFirstCapital 
                ? newName.charAt(0).toUpperCase() + newName.slice(1) 
                : newName.toLowerCase();
            return `${newAnimName}_${frameNum}.png`;
        }
    }

    return filename;
}

function processJson(inputPath, outputPath) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        
        // Create new structure with fps index and only necessary frame data
        const newStructure = {
            textures: [{
                image: jsonData.textures[0].image,
                format: jsonData.textures[0].format,
                size: jsonData.textures[0].size,
                scale: jsonData.textures[0].scale,
                fps: {  // FPS index by animation name
                    idle: 24,
                    walking: 24,
                    running: 24,
                    attacking: 24,
                    blocking: 24,
                    dying: 24,
                    hurt: 24,
                    dodging: 24
                },
                frames: []
            }]
        };

        // Convert frames back to array format with only necessary properties
        Object.entries(jsonData.textures[0].frames).forEach(([frameNum, frameData]) => {
            const filename = frameData.filename || `frame_${frameNum}.png`;
            
            // Only include filename and frame properties
            newStructure.textures[0].frames.push({
                filename: filename,
                frame: frameData.frame
            });
        });

        // Write the new JSON file
        fs.writeFileSync(
            outputPath, 
            JSON.stringify(newStructure, null, 2)
        );

        console.log(`\nSuccessfully processed ${inputPath} to ${outputPath}`);

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

// Command line handling
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.log('Usage: node convertAnimations.js <input-file> <output-file>');
        process.exit(1);
    }

    const [inputFile, outputFile] = args;
    processJson(inputFile, outputFile);
}

module.exports = { processJson, convertFilename };