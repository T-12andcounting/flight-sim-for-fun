import { authManager } from './auth/AuthManager.js';
import { Landing } from './pages/Landing.js';
import { Auth } from './pages/Auth.js';
import { Dashboard } from './pages/Dashboard.js';

export class Router {
    constructor(container) {
        this.container = container;
        this.currentPage = null;
        this.routes = {
            'landing': Landing,
            'auth': Auth,
            'dashboard': Dashboard,
            'game': null // Will be set externally
        };

        // Initialize hash-based routing
        window.addEventListener('hashchange', () => this.handleRouteChange());

        // Navigate to initial route
        this.handleRouteChange();
    }

    navigate(route) {
        window.location.hash = route;
    }

    handleRouteChange() {
        let route = window.location.hash.slice(1) || 'landing';

        // Protected routes
        if ((route === 'game' || route === 'dashboard') && !authManager.isAuthenticated()) {
            this.navigate('auth');
            return;
        }

        // If authenticated and on auth/landing, redirect to dashboard
        if ((route === 'auth' || route === 'landing') && authManager.isAuthenticated()) {
            route = 'dashboard';
            window.location.hash = route;
        }

        this.renderRoute(route);
    }

    renderRoute(route) {
        // Cleanup previous page
        if (this.currentPage && this.currentPage.destroy) {
            this.currentPage.destroy();
        }

        // Clear container
        this.container.innerHTML = '';

        // Render new page
        const PageClass = this.routes[route];

        if (PageClass) {
            this.currentPage = new PageClass(this.container, this);
            this.currentPage.render();
        } else if (route === 'game') {
            // Game route handled separately in main.js
            this.renderGame();
        } else {
            // 404 - redirect to landing
            this.navigate('landing');
        }
    }

    setGameRoute(gameInitializer) {
        this.gameInitializer = gameInitializer;
    }

    renderGame() {
        if (this.gameInitializer) {
            this.gameInitializer();
        }
    }
}
