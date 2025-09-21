// Local Storage Management Module
class StorageService {
    constructor() {
        this.keys = CONFIG.STORAGE_KEYS;
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            const data = {
                value,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            
            const data = JSON.parse(item);
            return data.value;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }

    // User Ratings Management
    getUserRating(movieId) {
        const ratings = this.getItem(this.keys.USER_RATINGS, {});
        return ratings[movieId] || 0;
    }

    setUserRating(movieId, rating) {
        const ratings = this.getItem(this.keys.USER_RATINGS, {});
        ratings[movieId] = {
            rating: parseInt(rating),
            timestamp: Date.now()
        };
        return this.setItem(this.keys.USER_RATINGS, ratings);
    }

    removeUserRating(movieId) {
        const ratings = this.getItem(this.keys.USER_RATINGS, {});
        delete ratings[movieId];
        return this.setItem(this.keys.USER_RATINGS, ratings);
    }

    getAllUserRatings() {
        return this.getItem(this.keys.USER_RATINGS, {});
    }

    // User Reviews Management
    getUserReview(movieId) {
        const reviews = this.getItem(this.keys.USER_REVIEWS, {});
        return reviews[movieId] || null;
    }

    setUserReview(movieId, reviewText, movieData = {}) {
        const reviews = this.getItem(this.keys.USER_REVIEWS, {});
        const rating = this.getUserRating(movieId);
        
        reviews[movieId] = {
            movieId,
            review: reviewText.trim(),
            rating: rating?.rating || 0,
            timestamp: Date.now(),
            movieTitle: movieData.title || 'Unknown Movie',
            moviePoster: movieData.poster_path || '',
            movieYear: movieData.release_date ? new Date(movieData.release_date).getFullYear() : 'Unknown'
        };
        
        return this.setItem(this.keys.USER_REVIEWS, reviews);
    }

    removeUserReview(movieId) {
        const reviews = this.getItem(this.keys.USER_REVIEWS, {});
        delete reviews[movieId];
        return this.setItem(this.keys.USER_REVIEWS, reviews);
    }

    getAllUserReviews() {
        const reviews = this.getItem(this.keys.USER_REVIEWS, {});
        return Object.values(reviews).sort((a, b) => b.timestamp - a.timestamp);
    }

    getReviewsCount() {
        const reviews = this.getItem(this.keys.USER_REVIEWS, {});
        return Object.keys(reviews).length;
    }

    // Favorites Management
    isFavorite(movieId) {
        const favorites = this.getItem(this.keys.FAVORITES, []);
        return favorites.includes(movieId);
    }

    addToFavorites(movieId, movieData = {}) {
        const favorites = this.getItem(this.keys.FAVORITES, []);
        if (!favorites.includes(movieId)) {
            favorites.push(movieId);
            this.setItem(this.keys.FAVORITES, favorites);
            
            // Store movie data for quick access
            const favoritesData = this.getItem(this.keys.FAVORITES + '_data', {});
            favoritesData[movieId] = {
                id: movieId,
                title: movieData.title || 'Unknown Movie',
                poster_path: movieData.poster_path || '',
                release_date: movieData.release_date || '',
                timestamp: Date.now()
            };
            this.setItem(this.keys.FAVORITES + '_data', favoritesData);
            
            return true;
        }
        return false;
    }

    removeFromFavorites(movieId) {
        const favorites = this.getItem(this.keys.FAVORITES, []);
        const index = favorites.indexOf(movieId);
        if (index > -1) {
            favorites.splice(index, 1);
            this.setItem(this.keys.FAVORITES, favorites);
            
            // Remove from favorites data
            const favoritesData = this.getItem(this.keys.FAVORITES + '_data', {});
            delete favoritesData[movieId];
            this.setItem(this.keys.FAVORITES + '_data', favoritesData);
            
            return true;
        }
        return false;
    }

    getAllFavorites() {
        const favorites = this.getItem(this.keys.FAVORITES, []);
        const favoritesData = this.getItem(this.keys.FAVORITES + '_data', {});
        
        return favorites.map(id => favoritesData[id] || { id }).filter(Boolean);
    }

    // Search History Management
    addToSearchHistory(query) {
        const history = this.getItem(this.keys.SEARCH_HISTORY, []);
        const trimmedQuery = query.trim().toLowerCase();
        
        if (trimmedQuery && !history.includes(trimmedQuery)) {
            history.unshift(trimmedQuery);
            // Keep only last 10 searches
            if (history.length > 10) {
                history.pop();
            }
            this.setItem(this.keys.SEARCH_HISTORY, history);
        }
    }

    getSearchHistory() {
        return this.getItem(this.keys.SEARCH_HISTORY, []);
    }

    clearSearchHistory() {
        return this.removeItem(this.keys.SEARCH_HISTORY);
    }

    // Export/Import Data
    exportUserData() {
        const data = {
            ratings: this.getItem(this.keys.USER_RATINGS, {}),
            reviews: this.getItem(this.keys.USER_REVIEWS, {}),
            favorites: this.getItem(this.keys.FAVORITES, []),
            favoritesData: this.getItem(this.keys.FAVORITES + '_data', {}),
            searchHistory: this.getItem(this.keys.SEARCH_HISTORY, []),
            exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(data, null, 2);
    }

    importUserData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.ratings) this.setItem(this.keys.USER_RATINGS, data.ratings);
            if (data.reviews) this.setItem(this.keys.USER_REVIEWS, data.reviews);
            if (data.favorites) this.setItem(this.keys.FAVORITES, data.favorites);
            if (data.favoritesData) this.setItem(this.keys.FAVORITES + '_data', data.favoritesData);
            if (data.searchHistory) this.setItem(this.keys.SEARCH_HISTORY, data.searchHistory);
            
            return true;
        } catch (error) {
            console.error('Failed to import user data:', error);
            return false;
        }
    }

    // Clear all user data
    clearAllData() {
        Object.values(this.keys).forEach(key => {
            this.removeItem(key);
            this.removeItem(key + '_data');
        });
    }

    // Get storage statistics
    getStorageStats() {
        const ratings = Object.keys(this.getItem(this.keys.USER_RATINGS, {})).length;
        const reviews = Object.keys(this.getItem(this.keys.USER_REVIEWS, {})).length;
        const favorites = this.getItem(this.keys.FAVORITES, []).length;
        const searchHistory = this.getItem(this.keys.SEARCH_HISTORY, []).length;
        
        return {
            ratingsCount: ratings,
            reviewsCount: reviews,
            favoritesCount: favorites,
            searchHistoryCount: searchHistory
        };
    }
}

// Create global instance
const storageService = new StorageService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageService, storageService };
}
