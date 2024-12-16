import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        host: true
    },
    optimizeDeps: {
        include: ['phaser']
    },
    build: {
        rollupOptions: {
            input: {
                main: '/index.html',
                game: '/game.html'
            }
        }
    }
});