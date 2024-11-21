import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        host: true
    },
    optimizeDeps: {
        include: ['phaser']
    }
});
