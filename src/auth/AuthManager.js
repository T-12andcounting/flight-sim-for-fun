import { supabase } from '../supabaseClient.js';

class AuthManager {
    constructor() {
        this.user = null;
        this.session = null;
        this.listeners = [];

        // Check for existing session
        this.initialize();
    }

    async initialize() {
        const { data: { session } } = await supabase.auth.getSession();
        this.session = session;
        this.user = session?.user || null;

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            this.user = session?.user || null;
            this.notifyListeners();
        });
    }

    async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    isAuthenticated() {
        return !!this.user;
    }

    getUser() {
        return this.user;
    }

    // Event system for UI updates
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.user));
    }
}

export const authManager = new AuthManager();
