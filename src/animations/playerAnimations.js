import { CombatResultType } from '../utils/combatDecoder';

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

export const COMBAT_RESULT_TO_ANIMATION = {
   'DODGE': 'dodging',
   'HIT': 'hurt',
   'BLOCK': 'blocking',
   'PARRY': 'blocking',
   'COUNTER': 'blocking',
   'RIPOST': 'blocking',
   'MISS': null,
   'ATTACK': 'attacking',
   'CRIT': 'attacking'
};

export function createPlayerAnimations(scene, spriteKey, isPlayer2 = false) {
   const texture = scene.textures.get(spriteKey);
   if (!texture) return;

   const jsonData = texture.get('__BASE').customData;
   
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

   let fpsSettings = defaultFpsValues;
   
   if (jsonData && jsonData.textures && jsonData.textures[0] && jsonData.textures[0].fps) {
       const textureFps = jsonData.textures[0].fps;
       
       fpsSettings = {
           idle: textureFps.idle || 24,
           walking: textureFps.walking || 24,
           running: textureFps.running || 24,
           attacking: textureFps.attacking || 24,
           blocking: textureFps.blocking || 24,
           dying: textureFps.dying || 24,
           hurt: textureFps.hurt || 24,
           dodging: textureFps.dodging || 24,
           taunting: textureFps.taunting || 24
       };
   }

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

   const animations = {
       'idle': { frames: 17, fps: defaultFps.idle, repeat: -1 },
       'walking': { frames: 11, fps: defaultFps.walking, repeat: -1 },
       'running': { frames: 11, fps: defaultFps.running, repeat: -1 },
       'dying': { frames: 14, fps: defaultFps.dying, repeat: 0 },
       'hurt': { frames: 11, fps: defaultFps.hurt, repeat: 0 },
       'attacking': { frames: 11, fps: defaultFps.attacking, repeat: 0 },
       'blocking': { frames: 11, fps: defaultFps.blocking, repeat: 0 },
       'dodging': { frames: 5, fps: defaultFps.dodging, repeat: 0 },
       'taunting': { frames: 11, fps: defaultFps.taunting, repeat: 0 }
   };

   Object.entries(animations).forEach(([key, config]) => {
    const animKey = isPlayer2 ? `${key}2` : key;
    
    if (scene.anims.exists(animKey)) {
        scene.anims.remove(animKey);
    }

    scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNames(spriteKey, {
            prefix: `${key}_`,
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