// Environment Configuration Loader
class EnvConfig {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    // Load configuration from various sources
    loadConfig() {
        // Try to load from environment variables first (for Node.js/server environments)
        if (typeof process !== 'undefined' && process.env) {
            this.loadFromProcessEnv();
        }
        
        // Fallback to browser localStorage for development
        this.loadFromLocalStorage();
        
        // Final fallback to hardcoded values (should be avoided in production)
        this.loadDefaults();
    }

    // Load from process.env (Node.js environment)
    loadFromProcessEnv() {
        if (typeof process !== 'undefined' && process.env) {
            this.config = {
                TMDB_API_KEY: process.env.TMDB_API_KEY,
                TMDB_BASE_URL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
                TMDB_IMAGE_BASE_URL: process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p',
                OMDB_API_KEY: process.env.OMDB_API_KEY,
                OMDB_BASE_URL: process.env.OMDB_BASE_URL || 'https://www.omdbapi.com',
                NODE_ENV: process.env.NODE_ENV || 'development'
            };
        }
    }

    // Load from localStorage (for client-side development)
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

    // Load default values (only for development)
    loadDefaults() {
        const defaults = {
            TMDB_BASE_URL: 'https://api.themoviedb.org/3',
            TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
            OMDB_BASE_URL: 'https://www.omdbapi.com',
            NODE_ENV: 'development'
        };

        // Only apply defaults for missing values
        Object.keys(defaults).forEach(key => {
            if (!this.config[key]) {
                this.config[key] = defaults[key];
            }
        });
    }

    // Get configuration value
    get(key) {
        return this.config[key];
    }

    // Set configuration value (and save to localStorage)
    set(key, value) {
        this.config[key] = value;
        this.saveToLocalStorage();
    }

    // Save current config to localStorage
    saveToLocalStorage() {
        if (typeof localStorage !== 'undefined') {
            try {
                // Don't save sensitive data to localStorage in production
                if (this.get('NODE_ENV') === 'production') {
                    return;
                }
                
                const configToSave = { ...this.config };
                // Remove sensitive keys before saving
                delete configToSave.TMDB_API_KEY;
                delete configToSave.OMDB_API_KEY;
                
                localStorage.setItem('movieSphere_config', JSON.stringify(configToSave));
            } catch (error) {
                console.warn('Failed to save configuration to localStorage');
            }
        }
    }

    // Check if API keys are configured
    isConfigured() {
        const tmdbKey = this.get('TMDB_API_KEY');
        return tmdbKey && 
               tmdbKey.length >= 20 && 
               tmdbKey !== 'your_tmdb_api_key_here' &&
               tmdbKey !== 'YOUR_TMDB_API_KEY_HERE';
    }

    // Get all config (for debugging)
    getAll() {
        const safeConfig = { ...this.config };
        // Mask sensitive information for logging
        if (safeConfig.TMDB_API_KEY) {
            safeConfig.TMDB_API_KEY = safeConfig.TMDB_API_KEY.slice(0, 8) + '...';
        }
        if (safeConfig.OMDB_API_KEY) {
            safeConfig.OMDB_API_KEY = safeConfig.OMDB_API_KEY.slice(0, 8) + '...';
        }
        return safeConfig;
    }

    // Setup configuration via UI (for development)
    setupConfigUI() {
        if (this.get('NODE_ENV') === 'production') {
            console.warn('Config UI is disabled in production');
            return;
        }

        const configModal = this.createConfigModal();
        document.body.appendChild(configModal);
    }

    // Create configuration modal for development
    createConfigModal() {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>Configure API Keys</h3>
                    <p>For security reasons, please enter your API keys:</p>
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem;">TMDB API Key:</label>
                        <input type="password" id="tmdb-key-input" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Enter your TMDB API key">
                    </div>
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem;">OMDB API Key (Optional):</label>
                        <input type="password" id="omdb-key-input" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Enter your OMDB API key">
                    </div>
                    <div style="margin-top: 1.5rem; text-align: right;">
                        <button onclick="this.closest('div').parentElement.remove()" style="margin-right: 1rem; padding: 0.5rem 1rem; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button id="save-config-btn" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Save & Continue</button>
                    </div>
                </div>
            </div>
        `;

        const saveBtn = modal.querySelector('#save-config-btn');
        saveBtn.addEventListener('click', () => {
            const tmdbKey = modal.querySelector('#tmdb-key-input').value;
            const omdbKey = modal.querySelector('#omdb-key-input').value;
            
            if (tmdbKey) {
                this.set('TMDB_API_KEY', tmdbKey);
            }
            if (omdbKey) {
                this.set('OMDB_API_KEY', omdbKey);
            }
            
            modal.remove();
            // Reload the page to apply new configuration
            window.location.reload();
        });

        return modal;
    }
}

// Create global instance
const envConfig = new EnvConfig();
