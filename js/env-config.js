// Environment Configuration Loader (Frontend Safe)
class EnvConfig {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    loadConfig() {
        // Try localStorage first (for devs entering keys manually)
        this.loadFromLocalStorage();

        // Fallback: look for global injected variables
        if (typeof window !== "undefined" && window.__APP_ENV__) {
            this.config = { ...this.config, ...window.__APP_ENV__ };
        }

        // Final defaults
        this.loadDefaults();
    }

    loadFromLocalStorage() {
        if (typeof localStorage !== 'undefined') {
            const savedConfig = localStorage.getItem('movieSphere_config');
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    this.config = { ...this.config, ...parsed };
                } catch (error) {
                    console.warn('Failed to parse saved configuration');
                }
            }
        }
    }

    loadDefaults() {
        const defaults = {
            TMDB_BASE_URL: 'https://api.themoviedb.org/3',
            TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
            OMDB_BASE_URL: 'https://www.omdbapi.com',
            NODE_ENV: 'development'
        };
        Object.keys(defaults).forEach(key => {
            if (!this.config[key]) {
                this.config[key] = defaults[key];
            }
        });
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        if (typeof localStorage !== 'undefined') {
            try {
                const configToSave = { ...this.config };
                delete configToSave.TMDB_API_KEY;
                delete configToSave.OMDB_API_KEY;
                localStorage.setItem('movieSphere_config', JSON.stringify(configToSave));
            } catch (error) {
                console.warn('Failed to save configuration to localStorage');
            }
        }
    }

    isConfigured() {
        const tmdbKey = this.get('TMDB_API_KEY');
        return tmdbKey && tmdbKey.length >= 20;
    }
}

const envConfig = new EnvConfig();
