import { authManager } from '../auth/AuthManager.js';

export class Landing {
    constructor(container, router) {
        this.container = container;
        this.router = router;
    }

    render() {
        this.container.innerHTML = `
            <div class="landing-page">
                <!-- Hero Section -->
                <section class="hero">
                    <div class="hero-content">
                        <h1 class="hero-title">Master the Skies</h1>
                        <p class="hero-subtitle">Experience realistic flight physics in this stunning 3D flight simulator</p>
                        <div class="hero-buttons">
                            <button id="play-now-btn" class="btn btn-primary">Play Now</button>
                            <button id="learn-more-btn" class="btn btn-secondary">Learn More</button>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="plane-preview">✈️</div>
                    </div>
                </section>

                <!-- Features Section -->
                <section class="features">
                    <h2>Features</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🎮</div>
                            <h3>Realistic Physics</h3>
                            <p>Experience true-to-life flight mechanics with accurate lift, drag, and banking turns</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🛬</div>
                            <h3>Practice Landing</h3>
                            <p>Perfect your approach and landing techniques on a realistic runway</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🌄</div>
                            <h3>Beautiful Scenery</h3>
                            <p>Fly over stunning procedurally generated terrain and mountains</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <h3>Easy Controls</h3>
                            <p>Simple keyboard controls with smooth, responsive handling</p>
                        </div>
                    </div>
                </section>

                <!-- CTA Section -->
                <section class="cta">
                    <h2>Ready to Take Flight?</h2>
                    <p>Join pilots worldwide mastering realistic flight simulation</p>
                    <button id="cta-signup-btn" class="btn btn-primary btn-large">Start Flying Free</button>
                </section>

                <!-- Footer -->
                <footer class="footer">
                    <p>&copy; 2025 Flight Simulator. Built with passion.</p>
                </footer>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const playBtn = this.container.querySelector('#play-now-btn');
        const ctaBtn = this.container.querySelector('#cta-signup-btn');
        const learnMoreBtn = this.container.querySelector('#learn-more-btn');

        playBtn?.addEventListener('click', () => {
            if (authManager.isAuthenticated()) {
                this.router.navigate('game');
            } else {
                this.router.navigate('auth');
            }
        });

        ctaBtn?.addEventListener('click', () => {
            this.router.navigate('auth');
        });

        learnMoreBtn?.addEventListener('click', () => {
            this.container.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
        });
    }

    destroy() {
        // Cleanup if needed
    }
}
