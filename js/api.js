// API Service Module
class APIService {
    constructor() {
        this.baseURL = CONFIG.TMDB.BASE_URL;
        this.apiKey = CONFIG.TMDB.API_KEY;
        this.imageBaseURL = CONFIG.TMDB.IMAGE_BASE_URL;
        this.cache = new Map();
    }

    // Check if API key is configured
    isConfigured() {
        // Check if API key exists and is not a placeholder
        const placeholders = ['YOUR_TMDB_API_KEY_HERE', 'your_api_key_here', 'API_KEY_HERE'];
        return this.apiKey && 
               this.apiKey.length >= 20 && 
               !placeholders.includes(this.apiKey) &&
               !/^(your|api|key|here|placeholder)/i.test(this.apiKey);
    }

    // Test API key validity
    async testAPIKey() {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            const url = this.buildURL('/configuration');
            const response = await fetch(url);
            return response.ok;
        } catch (error) {
            console.error('API key test failed:', error);
            return false;
        }
    }

    // Build URL with API key and parameters
    buildURL(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        url.searchParams.append('api_key', this.apiKey);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
        
        return url.toString();
    }

    // Generic API request with caching
    async request(endpoint, params = {}, useCache = true) {
        if (!this.isConfigured()) {
            throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
        }

        const url = this.buildURL(endpoint, params);
        const cacheKey = url;

        // Check cache first
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.APP.CACHE_DURATION) {
                return cached.data;
            }
        }

        try {
            console.log('Making API request to:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your TMDB API key in config.js');
                } else if (response.status === 404) {
                    throw new Error('Resource not found');
                } else {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            // Cache the response
            if (useCache) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error.message);
            console.error('URL (with hidden key):', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
            
            if (error.message.includes('Invalid API key')) {
                throw new Error('Invalid API key. Please verify your TMDB API key is correct.');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            } else {
                throw error;
            }
        }
    }

    // Get trending movies
    async getTrendingMovies(page = 1) {
        return this.request(CONFIG.ENDPOINTS.TRENDING, { page });
    }

    // Get top rated movies
    async getTopRatedMovies(page = 1) {
        return this.request(CONFIG.ENDPOINTS.TOP_RATED, { page });
    }

    // Search movies
    async searchMovies(query, page = 1) {
        if (!query.trim()) {
            return { results: [], total_results: 0 };
        }
        
        return this.request(CONFIG.ENDPOINTS.SEARCH, { 
            query: query.trim(), 
            page 
        });
    }

    // Get movie details
    async getMovieDetails(movieId) {
        return this.request(`${CONFIG.ENDPOINTS.MOVIE_DETAILS}/${movieId}`);
    }

    // Get movie credits (cast and crew)
    async getMovieCredits(movieId) {
        return this.request(`${CONFIG.ENDPOINTS.MOVIE_DETAILS}/${movieId}/credits`);
    }

    // Get full movie data (details + credits)
    async getFullMovieData(movieId) {
        try {
            const [details, credits] = await Promise.all([
                this.getMovieDetails(movieId),
                this.getMovieCredits(movieId)
            ]);
            
            return {
                ...details,
                credits
            };
        } catch (error) {
            console.error('Failed to fetch full movie data:', error);
            throw error;
        }
    }

    // Get movie poster URL
    getImageURL(path, size = 'MEDIUM') {
        if (!path) return 'images/no-poster.jpg'; // Fallback image
        
        const sizeParam = CONFIG.TMDB.POSTER_SIZES[size] || CONFIG.TMDB.POSTER_SIZES.MEDIUM;
        return `${this.imageBaseURL}${sizeParam}${path}`;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache size
    getCacheSize() {
        return this.cache.size;
    }
}

// OMDB API Service (Alternative/Backup)
class OMDBService {
    constructor() {
        this.baseURL = CONFIG.OMDB.BASE_URL;
        this.apiKey = CONFIG.OMDB.API_KEY;
    }

    isConfigured() {
        return this.apiKey && this.apiKey !== 'YOUR_OMDB_API_KEY_HERE';
    }

    async searchMovies(query) {
        if (!this.isConfigured() || !query.trim()) {
            return { Search: [], totalResults: 0 };
        }

        try {
            const url = `${this.baseURL}?apikey=${this.apiKey}&s=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            const data = await response.json();
            
            return data.Response === 'True' ? data : { Search: [], totalResults: 0 };
        } catch (error) {
            console.error('OMDB search failed:', error);
            return { Search: [], totalResults: 0 };
        }
    }

    async getMovieDetails(imdbId) {
        if (!this.isConfigured() || !imdbId) {
            throw new Error('OMDB service not configured or invalid ID');
        }

        try {
            const url = `${this.baseURL}?apikey=${this.apiKey}&i=${imdbId}&plot=full`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.Response === 'False') {
                throw new Error(data.Error || ERROR_MESSAGES.MOVIE_NOT_FOUND);
            }
            
            return data;
        } catch (error) {
            console.error('OMDB details fetch failed:', error);
            throw error;
        }
    }
}

// Create global instances
const apiService = new APIService();
const omdbService = new OMDBService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, OMDBService, apiService, omdbService };
}
