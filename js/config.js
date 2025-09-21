// Configuration and Constants
const CONFIG = {
    // TMDB API Configuration
    TMDB: {
        BASE_URL: (typeof envConfig !== 'undefined' && envConfig.get('TMDB_BASE_URL')) || 'https://api.themoviedb.org/3',
        IMAGE_BASE_URL: (typeof envConfig !== 'undefined' && envConfig.get('TMDB_IMAGE_BASE_URL')) || 'https://image.tmdb.org/t/p',
        API_KEY: (typeof envConfig !== 'undefined' && envConfig.get('TMDB_API_KEY')) || '2327ea19fe841759d899118abf7eade6', // Fallback to current key
        POSTER_SIZES: {
            SMALL: '/w342',
            MEDIUM: '/w500',
            LARGE: '/w780'
        }
    },
    
    // OMDB API Configuration (Alternative/Backup)
    OMDB: {
        BASE_URL: (typeof envConfig !== 'undefined' && envConfig.get('OMDB_BASE_URL')) || 'https://www.omdbapi.com',
        API_KEY: (typeof envConfig !== 'undefined' && envConfig.get('OMDB_API_KEY')) || 'YOUR_OMDB_API_KEY_HERE'
    },
    
    // Application Settings
    APP: {
        ITEMS_PER_PAGE: 20,
        DEBOUNCE_DELAY: 300,
        TOAST_DURATION: 3000,
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
        MAX_SEARCH_SUGGESTIONS: 5
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        USER_RATINGS: 'moviesphere_user_ratings',
        USER_REVIEWS: 'moviesphere_user_reviews',
        FAVORITES: 'moviesphere_favorites',
        SEARCH_HISTORY: 'moviesphere_search_history',
        CACHE: 'moviesphere_api_cache'
    },
    
    // API Endpoints
    ENDPOINTS: {
        TRENDING: '/trending/movie/week',
        TOP_RATED: '/movie/top_rated',
        SEARCH: '/search/movie',
        MOVIE_DETAILS: '/movie',
        MOVIE_CREDITS: '/movie/{id}/credits'
    }
};

// Error Messages
const ERROR_MESSAGES = {
    API_KEY_MISSING: 'API key is missing. Please add your TMDB API key to the configuration.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    MOVIE_NOT_FOUND: 'Movie not found.',
    GENERIC_ERROR: 'Something went wrong. Please try again.',
    RATING_REQUIRED: 'Please select a rating before saving your review.',
    REVIEW_TOO_SHORT: 'Review must be at least 10 characters long.'
};

// Success Messages
const SUCCESS_MESSAGES = {
    REVIEW_SAVED: 'Review saved successfully!',
    REVIEW_UPDATED: 'Review updated successfully!',
    REVIEW_DELETED: 'Review deleted successfully!',
    RATING_SAVED: 'Rating saved!',
    MOVIE_ADDED_TO_FAVORITES: 'Movie added to favorites!'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES };
}
