// Define valid animations and their properties
export const VALID_ANIMATIONS = {
    idle: { repeat: true },
    walking: { repeat: true },
    running: { repeat: true },
    attacking: { repeat: false },
    blocking: { repeat: false },
    dying: { repeat: false },
    hurt: { repeat: false },
    dodging: { repeat: false },
    taunting: { repeat: false }
};

// Create animations for a sprite
export function createPlayerAnimations(scene, spriteKey, isPlayer2 = false) {
    const texture = scene.textures.get(spriteKey);
    if (!texture) return;

    // Get FPS from texture data
    const jsonData = texture.get('__BASE').customData;
    
    // Default FPS values in case JSON loading fails
    const defaultFpsValues = {
        idle: 24,
        walking: 24,
        running: 24,
        attacking: 24,
        blocking: 24,
        dying: 24,
        hurt: 24,
        dodging: 24,
        taunting: 24
    };

    // Try to get FPS settings from the JSON structure
    let fpsSettings = defaultFpsValues;
    
    if (jsonData && jsonData.fps) {
        fpsSettings = {
            ...defaultFpsValues,
            ...jsonData.fps
        };
    } else if (jsonData && jsonData.textures && jsonData.textures[0] && jsonData.textures[0].fps) {
        fpsSettings = {
            ...defaultFpsValues,
            ...jsonData.textures[0].fps
        };
    }

    // Use these settings for animations
    const defaultFps = {
        idle: fpsSettings.idle,
        walking: fpsSettings.walking,
        running: fpsSettings.running,
        dying: fpsSettings.dying,
        hurt: fpsSettings.hurt,
        blocking: fpsSettings.blocking,
        attacking: fpsSettings.attacking,
        dodging: fpsSettings.dodging,
        taunting: fpsSettings.taunting
    };

    // Find a sample frame to detect if we have a prefix
    const sampleFrame = texture.getFrameNames()[0] || '';
    const hasPrefix = sampleFrame.includes('0_Knight_');
    const framePrefix = hasPrefix ? '0_Knight_' : '';

    // Base animations that match their frame names
    const baseAnimations = {
        'idle': { frames: 17, fps: defaultFps.idle, repeat: -1 },
        'walking': { frames: 11, fps: defaultFps.walking, repeat: -1 },
        'running': { frames: 11, fps: defaultFps.running, repeat: -1 },
        'dying': { frames: 14, fps: defaultFps.dying, repeat: 0 },
        'hurt': { frames: 11, fps: defaultFps.hurt, repeat: 0 }
    };

    // Create base animations with proper prefixes
    Object.entries(baseAnimations).forEach(([key, config]) => {
        const animKey = isPlayer2 ? `${key}2` : key;
        
        if (scene.anims.exists(animKey)) {
            scene.anims.remove(animKey);
        }

        scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames(spriteKey, {
                prefix: `${framePrefix}${key.charAt(0).toUpperCase() + key.slice(1)}_`,
                start: 0,
                end: config.frames,
                zeroPad: 3,
                suffix: '.png'
            }),
            frameRate: config.fps,
            repeat: config.repeat
        });
    });

    // Special handling for attack animations
    const attackAnimations = [
        `${framePrefix}Slashing`,
        `${framePrefix}Swinging Rod`
    ];

    // Try each attack animation type until we find one that exists
    for (const attackType of attackAnimations) {
        const animKey = isPlayer2 ? 'attacking2' : 'attacking';
        
        if (scene.anims.exists(animKey)) continue;
        
        const frames = texture.getFrameNames().filter(name => name.startsWith(`${attackType}_`));
        if (frames.length === 0) continue;
        
        scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames(spriteKey, {
                prefix: `${attackType}_`,
                start: 0,
                end: 11,
                zeroPad: 3,
                suffix: '.png'
            }),
            frameRate: defaultFps.attacking,
            repeat: 0
        });
    }

    // Mapped animations that need different prefixes
    const mappedAnimations = {
        [`${framePrefix}Kicking`]: { newName: 'blocking', fps: defaultFps.blocking, frames: 11, repeat: 0 },
        [`${framePrefix}Sliding`]: { newName: 'dodging', fps: defaultFps.dodging, frames: 5, repeat: 0 },
        [`${framePrefix}Throwing`]: { newName: 'taunting', fps: defaultFps.taunting, frames: 11, repeat: 0 }
    };

    // Create mapped animations
    Object.entries(mappedAnimations).forEach(([originalName, config]) => {
        const animKey = isPlayer2 ? `${config.newName}2` : config.newName;
        
        if (scene.anims.exists(animKey)) {
            return;
        }
        
        const testFrame = scene.textures.get(spriteKey).get(`${originalName}_000.png`);
        if (!testFrame) {
            return;
        }
        
        scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames(spriteKey, {
                prefix: `${originalName}_`,
                start: 0,
                end: config.frames,
                zeroPad: 3,
                suffix: '.png'
            }),
            frameRate: config.fps,
            repeat: config.repeat
        });
    });
}