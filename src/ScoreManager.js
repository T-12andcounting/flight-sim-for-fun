import { supabase } from './supabaseClient.js';

class ScoreManager {
    constructor() {
        this.scores = [];
    }

    async saveScore(score, userId) {
        if (!userId) {
            console.log('User ID not provided, score not saved.');
            return null;
        }

        if (score <= 0) return null;

        try {
            const { data, error } = await supabase
                .from('high_scores')
                .insert([
                    { user_id: userId, score: Math.round(score) }
                ])
                .select();

            if (error) throw error;
            console.log('High score saved:', data);
            return data;
        } catch (error) {
            console.error('Error saving high score:', error);
            return null;
        }
    }

    async getHighScores(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('high_scores')
                .select('*')
                .order('score', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching high scores:', error);
            return [];
        }
    }
}

export const scoreManager = new ScoreManager();
