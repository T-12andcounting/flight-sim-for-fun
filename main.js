import { Router } from './src/Router.js';
import { Game } from './src/Game.js';
import { authManager } from './src/auth/AuthManager.js';

// Wait for auth to initialize before starting router
async function initializeApp() {
    try {
        console.log('Initializing auth...');
        // Timeout after 2 seconds to prevent hang
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth initialization timed out')), 2000));
        await Promise.race([authManager.initialize(), timeout]);
        console.log('Auth initialized successfully');
    } catch (error) {
        console.error('Auth initialization failed or timed out:', error);
        // We continue anyway, as the router handles unauthenticated state (redirects to auth page)
    }

    const app = document.querySelector('#app');
    if (!app) {
        console.error('CRITICAL: #app element not found in DOM');
        return;
    }

    const router = new Router(app);

    // Set up game route handler
    let currentGame = null;
    router.setGameRoute(() => {
        // Cleanup previous game instance if exists
        if (currentGame) {
            currentGame.destroy();
        }

        // Create new game instance
        currentGame = new Game(app);
    });
}

initializeApp();
