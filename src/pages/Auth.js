import { authManager } from '../auth/AuthManager.js';

export class Auth {
    constructor(container, router) {
        this.container = container;
        this.router = router;
        this.mode = 'login'; // 'login' or 'signup'
    }

    render() {
        this.container.innerHTML = `
            <div class="auth-page">
                <div class="auth-container">
                    <h1 class="auth-title">Flight Simulator</h1>
                    
                    <div class="auth-tabs">
                        <button id="login-tab" class="tab-btn ${this.mode === 'login' ? 'active' : ''}">Login</button>
                        <button id="signup-tab" class="tab-btn ${this.mode === 'signup' ? 'active' : ''}">Sign Up</button>
                    </div>

                    <form id="auth-form" class="auth-form">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required placeholder="pilot@example.com">
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" required placeholder="••••••••">
                        </div>
                        <div id="error-message" class="error-message" style="display: none;"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="submit-btn">
                            ${this.mode === 'login' ? 'Login' : 'Sign Up'}
                        </button>
                    </form>

                    <div class="auth-footer">
                        <button id="back-btn" class="link-btn">← Back to Home</button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = this.container.querySelector('#auth-form');
        const loginTab = this.container.querySelector('#login-tab');
        const signupTab = this.container.querySelector('#signup-tab');
        const backBtn = this.container.querySelector('#back-btn');

        loginTab?.addEventListener('click', () => {
            this.mode = 'login';
            this.render();
        });

        signupTab?.addEventListener('click', () => {
            this.mode = 'signup';
            this.render();
        });

        backBtn?.addEventListener('click', () => {
            this.router.navigate('landing');
        });

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.email.value;
            const password = form.password.value;
            const errorMsg = this.container.querySelector('#error-message');
            const submitBtn = this.container.querySelector('#submit-btn');

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Loading...';
                errorMsg.style.display = 'none';

                if (this.mode === 'login') {
                    await authManager.signIn(email, password);
                    this.router.navigate('game');
                } else {
                    await authManager.signUp(email, password);
                    errorMsg.textContent = 'Account created! Check your email to verify.';
                    errorMsg.style.display = 'block';
                    errorMsg.style.color = '#00ff00';
                }
            } catch (error) {
                errorMsg.textContent = error.message || 'Authentication failed';
                errorMsg.style.display = 'block';
                errorMsg.style.color = '#ff0000';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = this.mode === 'login' ? 'Login' : 'Sign Up';
            }
        });
    }

    destroy() {
        // Cleanup if needed
    }
}
