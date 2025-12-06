import { authManager } from '../auth/AuthManager.js';
import { scoreManager } from '../ScoreManager.js';

export class Dashboard {
    constructor(container, router) {
        this.container = container;
        this.router = router;
    }

    async render() {
        const user = authManager.getUser();

        this.container.innerHTML = `
            <div class="dashboard-page">
                <div class="dashboard-container">
                    <h1>Pilot Dashboard</h1>
                    
                    <div class="user-info">
                        <h2>Welcome, ${user?.email || 'Pilot'}!</h2>
                        <p class="user-id">User ID: ${user?.id}</p>
                    </div>

                    <div class="dashboard-actions">
                        <button id="play-game-btn" class="btn btn-primary">🎮 Launch Flight Simulator</button>
                        <button id="logout-btn" class="btn btn-secondary">Logout</button>
                    </div>

                    <div class="dashboard-features">
                        <h3>🏆 Top Pilots</h3>
                        <div id="leaderboard-container">
                            <p>Loading scores...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        await this.loadHighScores();
    }

    async loadHighScores() {
        const container = this.container.querySelector('#leaderboard-container');
        if (!container) return;

        const scores = await scoreManager.getHighScores(10);

        if (scores.length === 0) {
            container.innerHTML = '<p>No flights recorded yet. Be the first!</p>';
            return;
        }

        let html = '<table class="leaderboard-table"><thead><tr><th>Rank</th><th>Pilot ID</th><th>Score</th><th>Date</th></tr></thead><tbody>';

        scores.forEach((entry, index) => {
            const date = new Date(entry.created_at).toLocaleDateString();
            // Truncate user ID for display
            const shortId = entry.user_id.substring(0, 8) + '...';
            const isMe = entry.user_id === authManager.getUser()?.id;
            const rowClass = isMe ? 'highlight-row' : '';

            html += `
                <tr class="${rowClass}">
                    <td>#${index + 1}</td>
                    <td title="${entry.user_id}">${shortId} ${isMe ? '(You)' : ''}</td>
                    <td>${entry.score}</td>
                    <td>${date}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    attachEventListeners() {
        const playBtn = this.container.querySelector('#play-game-btn');
        const logoutBtn = this.container.querySelector('#logout-btn');

        playBtn?.addEventListener('click', () => {
            this.router.navigate('game');
        });

        logoutBtn?.addEventListener('click', async () => {
            await authManager.signOut();
            this.router.navigate('landing');
        });
    }

    destroy() {
        // Cleanup if needed
    }
}
