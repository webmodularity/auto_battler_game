// Define valid animations and their properties
export const VALID_ANIMATIONS = {
    idle: { repeat: true },
    walking: { repeat: true },
    running: { repeat: true },
    attacking: { repeat: false },  // was 'slashing'
    blocking: { repeat: false },   // was 'kicking'
    dying: { repeat: false },
    hurt: { repeat: false },
    dodging: { repeat: false },    // was 'sliding'
    taunting: { repeat: false }    // was 'throwing'
};

// Create animations for a sprite
export function createPlayerAnimations(scene, spriteKey) {
    const jsonData = scene.cache.json.get(`${spriteKey}Data`);
    if (!jsonData) {
        console.error(`No JSON data available for animations: ${spriteKey}Data`);
        return;
    }
    
    // Clear any existing animations for this spriteKey to prevent conflicts
    scene.anims.remove(scene.anims.get(spriteKey));
    
    const fps = jsonData.textures[0].fps;
    const isPlayer2 = spriteKey === 'knight2';  // Explicitly check for knight2
    const suffix = isPlayer2 ? '2' : '';

    // Base animations that match their frame names
    const baseAnimations = {
        'idle': { frames: 17, fps: fps.idle, repeat: -1 },
        'walking': { frames: 11, fps: fps.walking, repeat: -1 },
        'running': { frames: 11, fps: fps.running, repeat: -1 },
        'dying': { frames: 14, fps: fps.dying, repeat: 0 },
        'hurt': { frames: 11, fps: fps.hurt, repeat: 0 }
    };

    // Create base animations
    Object.entries(baseAnimations).forEach(([key, config]) => {
        const animKey = `${key}${suffix}`;
        if (scene.anims.exists(animKey)) {
            scene.anims.remove(animKey);
        }
        scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames(spriteKey, {
                prefix: `${key.charAt(0).toUpperCase() + key.slice(1)}_`,
                start: 0,
                end: config.frames,
                zeroPad: 3,
                suffix: '.png'
            }),
            frameRate: config.fps,
            repeat: config.repeat
        });
    });

    // Mapped animations that need different prefixes
    const mappedAnimations = {
        'Kicking': { newName: 'blocking', fps: fps.blocking, frames: 11, repeat: 0 },
        'Slashing': { newName: 'attacking', fps: fps.attacking, frames: 11, repeat: 0 },
        'Sliding': { newName: 'dodging', fps: fps.dodging, frames: 5, repeat: 0 },
        'Throwing': { newName: 'taunting', fps: fps.taunting, frames: 11, repeat: 0 }
    };

    // Create mapped animations
    Object.entries(mappedAnimations).forEach(([originalName, config]) => {
        const animKey = `${config.newName}${suffix}`;
        if (scene.anims.exists(animKey)) {
            scene.anims.remove(animKey);
        }
        scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames(spriteKey, {
                prefix: `${originalName}_`,
                suffix: '.png',
                start: 0,
                end: config.frames,
                zeroPad: 3
            }),
            frameRate: config.fps,
            repeat: config.repeat
        });
    });
}