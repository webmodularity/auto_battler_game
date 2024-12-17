import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/',
    server: {
        host: true
    },
    optimizeDeps: {
        include: ['phaser']
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                game: resolve(__dirname, 'game.html')
            }
        },
        assetsDir: 'assets',
        emptyOutDir: true,
        sourcemap: true,
        // Copy public directory contents to build output
        copyPublicDir: true
    },
    // Explicitly configure public directory
    publicDir: 'public'
});