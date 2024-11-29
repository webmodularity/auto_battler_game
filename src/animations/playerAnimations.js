// Define valid animations and their properties
export const VALID_ANIMATIONS = {
    idle: { repeat: true },
    walking: { repeat: true },
    running: { repeat: true },
    attacking: { repeat: false },  // was 'slashing'
    blocking: { repeat: false },   // was 'kicking'
    dying: { repeat: false },
    hurt: { repeat: false },
    dodging: { repeat: false }     // was 'sliding'
};

// Create animations for a sprite
export function createPlayerAnimations(scene, textureKey, suffix = '') {
    const spriteData = scene.cache.json.get('playerData');
    
    if (!spriteData?.textures?.[0]?.frames) {
        console.error('Invalid sprite data structure');
        return;
    }

    const fpsSettings = spriteData.textures[0].fps || {};
    const animationFrames = {};
    
    spriteData.textures[0].frames.forEach(frameData => {
        const match = frameData.filename.match(/^([A-Za-z]+)_\d+\.png$/);
        if (!match) return;
        
        let animName = match[1].toLowerCase();
        
        // Convert animation names according to mappings
        if (animName === 'slashing') animName = 'attacking';
        if (animName === 'kicking') animName = 'blocking';
        if (animName === 'sliding') animName = 'dodging';
        
        if (!VALID_ANIMATIONS[animName]) return;

        if (!animationFrames[animName]) {
            animationFrames[animName] = [];
        }
        animationFrames[animName].push(frameData.filename);
    });

    Object.entries(animationFrames).forEach(([key, frames]) => {
        const animKey = key + suffix;
        if (scene.anims.exists(animKey)) return;

        frames.sort((a, b) => {
            const numA = parseInt(a.match(/_(\d+)\.png$/)[1]);
            const numB = parseInt(b.match(/_(\d+)\.png$/)[1]);
            return numA - numB;
        });

        scene.anims.create({
            key: animKey,
            frames: frames.map(frame => ({
                key: textureKey,
                frame: frame
            })),
            frameRate: fpsSettings[key] || 24,
            repeat: VALID_ANIMATIONS[key]?.repeat ? -1 : 0
        });
    });
}