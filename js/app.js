// Main Application Module
class MovieSphereApp {
    constructor() {
        this.currentPage = 1;
        this.currentSection = 'trending';
        this.searchQuery = '';
        this.searchTimeout = null;
        this.isLoading = false;

        // Initialize the application
        this.init();
    }

    // Initialize the application
    async init() {
        try {
            // Check if API is configured
            if (!apiService.isConfigured()) {
                UIComponents.showToast('API key not configured. Please add your TMDB API key to js/config.js', 'error', 8000);
                console.error('❌ API Configuration Error:');
                console.error('Please configure your TMDB API key in js/config.js');
                console.error('Current API key:', CONFIG.TMDB.API_KEY);
                console.error('Open api-test.html for detailed setup instructions');
                return;
            }

            // Test API key validity
            console.log('🔄 Testing API key...');
            const isApiValid = await apiService.testAPIKey();
            if (!isApiValid) {
                UIComponents.showToast('Invalid API key. Please check your TMDB API key configuration.', 'error', 8000);
                console.error('❌ API key validation failed');
                console.error('Open api-test.html for troubleshooting');
                return;
            }
            console.log('✅ API key is valid');

            // Setup event listeners
            this.setupEventListeners();

            // Set initial home state
            this.setInitialHomeState();

            // Load initial content
            await this.loadInitialContent();

            // Update reviews display
            UIComponents.updateReviewsDisplay();

            console.log('MovieSphere app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            UIComponents.showToast('Failed to initialize application', 'error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Navigation
        this.setupNavigation();

        // Search
        this.setupSearch();

        // Modal events
        this.setupModalEvents();

        // Scroll events
        this.setupScrollEvents();

        // Keyboard events
        this.setupKeyboardEvents();
    }

    // Setup navigation events
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                this.navigateToSection(href.substring(1)); // Remove #
            });
        });

        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    // Setup search functionality
    setupSearch() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        const searchSuggestions = document.getElementById('search-suggestions');

        if (searchForm && searchInput) {
            // Search form submission
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            });

            // Real-time search suggestions with debouncing
            searchInput.addEventListener('input', Utils.debounce((e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.showSearchSuggestions(query);
                } else {
                    this.hideSearchSuggestions();
                }
            }, CONFIG.APP.DEBOUNCE_DELAY));

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchForm.contains(e.target)) {
                    this.hideSearchSuggestions();
                }
            });
        }
    }

    // Setup modal events
    setupModalEvents() {
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UIComponents.hideModal();
            }
        });
    }

    // Setup scroll events
    setupScrollEvents() {
        // Infinite scroll for search results
        window.addEventListener('scroll', Utils.throttle(() => {
            if (this.currentSection === 'search-results' && !this.isLoading) {
                const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
                if (scrollTop + clientHeight >= scrollHeight - 1000) {
                    this.loadMoreSearchResults();
                }
            }
        }, 200));
    }

    // Setup keyboard events
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Focus search with '/' key
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    // Set initial home state
    setInitialHomeState() {
        // Ensure home is active and trending/top-rated are visible
        this.currentSection = 'home';
        
        // Set home nav as active
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const homeLink = document.querySelector('[href="#home"]');
        if (homeLink) {
            homeLink.classList.add('active');
        }
        
        // Show trending and top-rated sections, hide others
        document.getElementById('trending').classList.remove('hidden');
        document.getElementById('top-rated').classList.remove('hidden');
        document.getElementById('search-results').classList.add('hidden');
        document.getElementById('my-reviews').classList.add('hidden');
    }

    // Navigate to section
    async navigateToSection(sectionId) {
        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Hide all sections except for home navigation
        if (sectionId !== 'home') {
            document.querySelectorAll('.movies-section, .reviews-section').forEach(section => {
                section.classList.add('hidden');
            });

            // Show target section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        } else {
            // For home, hide only search results and my-reviews
            document.getElementById('search-results').classList.add('hidden');
            document.getElementById('my-reviews').classList.add('hidden');
        }

        this.currentSection = sectionId;
        this.currentPage = 1;

        // Load content based on section
        switch (sectionId) {
            case 'trending':
                await this.loadTrendingMovies();
                break;
            case 'top-rated':
                await this.loadTopRatedMovies();
                break;
            case 'my-reviews':
                UIComponents.updateReviewsDisplay();
                break;
            case 'home':
                // Show both trending and top-rated sections for home
                document.getElementById('trending').classList.remove('hidden');
                document.getElementById('top-rated').classList.remove('hidden');
                // Hide search results if visible
                document.getElementById('search-results').classList.add('hidden');
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
        }
    }

    // Load initial content
    async loadInitialContent() {
        await Promise.all([
            this.loadTrendingMovies(),
            this.loadTopRatedMovies()
        ]);
    }

    // Load trending movies
    async loadTrendingMovies() {
        const container = document.getElementById('trending-movies');
        if (!container) return;

        try {
            UIComponents.showLoading(container);
            const data = await apiService.getTrendingMovies(this.currentPage);
            
            container.innerHTML = '';
            data.results.forEach(movie => {
                if (Utils.validateMovieData(movie)) {
                    container.appendChild(UIComponents.createMovieCard(movie));
                }
            });
        } catch (error) {
            console.error('Failed to load trending movies:', error);
            container.innerHTML = '<p class="error-message">Failed to load trending movies</p>';
            UIComponents.showToast('Failed to load trending movies', 'error');
        }
    }

    // Load top rated movies
    async loadTopRatedMovies() {
        const container = document.getElementById('top-rated-movies');
        if (!container) return;

        try {
            UIComponents.showLoading(container);
            const data = await apiService.getTopRatedMovies(this.currentPage);
            
            container.innerHTML = '';
            data.results.forEach(movie => {
                if (Utils.validateMovieData(movie)) {
                    container.appendChild(UIComponents.createMovieCard(movie));
                }
            });
        } catch (error) {
            console.error('Failed to load top rated movies:', error);
            container.innerHTML = '<p class="error-message">Failed to load top rated movies</p>';
            UIComponents.showToast('Failed to load top rated movies', 'error');
        }
    }

    // Perform search
    async performSearch(query) {
        if (!query.trim()) return;

        this.searchQuery = query;
        this.currentPage = 1;

        // Add to search history
        storageService.addToSearchHistory(query);

        // Show search results section
        await this.navigateToSection('search-results');

        const container = document.getElementById('search-results-grid');
        const sectionTitle = document.querySelector('#search-results .section-title');
        
        if (sectionTitle) {
            sectionTitle.textContent = `Search Results for "${query}"`;
        }

        try {
            UIComponents.showLoading(container);
            const data = await apiService.searchMovies(query, this.currentPage);
            
            container.innerHTML = '';
            
            if (data.results.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h4>No movies found</h4>
                        <p>Try searching with different keywords</p>
                    </div>
                `;
            } else {
                data.results.forEach(movie => {
                    if (Utils.validateMovieData(movie)) {
                        container.appendChild(UIComponents.createMovieCard(movie));
                    }
                });
            }
        } catch (error) {
            console.error('Search failed:', error);
            container.innerHTML = '<p class="error-message">Search failed. Please try again.</p>';
            UIComponents.showToast('Search failed', 'error');
        }
    }

    // Load more search results (infinite scroll)
    async loadMoreSearchResults() {
        if (!this.searchQuery || this.isLoading) return;

        this.isLoading = true;
        this.currentPage++;

        try {
            const data = await apiService.searchMovies(this.searchQuery, this.currentPage);
            const container = document.getElementById('search-results-grid');
            
            data.results.forEach(movie => {
                if (Utils.validateMovieData(movie)) {
                    container.appendChild(UIComponents.createMovieCard(movie));
                }
            });
        } catch (error) {
            console.error('Failed to load more results:', error);
            this.currentPage--; // Revert page increment
        } finally {
            this.isLoading = false;
        }
    }

    // Show search suggestions
    async showSearchSuggestions(query) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;

        try {
            const data = await apiService.searchMovies(query, 1);
            const suggestions = data.results.slice(0, CONFIG.APP.MAX_SEARCH_SUGGESTIONS);
            
            if (suggestions.length > 0) {
                suggestionsContainer.innerHTML = suggestions.map(movie => `
                    <div class="search-suggestion" data-movie-id="${movie.id}">
                        <img src="${apiService.getImageURL(movie.poster_path, 'SMALL')}" alt="${Utils.sanitizeHTML(movie.title)}" class="suggestion-poster">
                        <div class="suggestion-info">
                            <h5>${Utils.sanitizeHTML(movie.title)}</h5>
                            <p>${Utils.getYearFromDate(movie.release_date)}</p>
                        </div>
                    </div>
                `).join('');

                // Add click events to suggestions
                suggestionsContainer.querySelectorAll('.search-suggestion').forEach(suggestion => {
                    suggestion.addEventListener('click', () => {
                        const movieId = suggestion.getAttribute('data-movie-id');
                        UIComponents.showMovieModal(movieId);
                        this.hideSearchSuggestions();
                    });
                });

                suggestionsContainer.classList.add('show');
            } else {
                this.hideSearchSuggestions();
            }
        } catch (error) {
            console.error('Failed to load search suggestions:', error);
            this.hideSearchSuggestions();
        }
    }

    // Hide search suggestions
    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('show');
        }
    }

    // Get application statistics
    getStats() {
        const storageStats = storageService.getStorageStats();
        const cacheSize = apiService.getCacheSize();
        
        return {
            ...storageStats,
            cacheSize,
            currentSection: this.currentSection,
            searchQuery: this.searchQuery
        };
    }

    // Export user data
    exportUserData() {
        try {
            const data = storageService.exportUserData();
            Utils.downloadJSON(JSON.parse(data), `moviesphere-backup-${Utils.formatDate(Date.now(), 'year')}.json`);
            UIComponents.showToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export data:', error);
            UIComponents.showToast('Failed to export data', 'error');
        }
    }

    // Import user data
    async importUserData(file) {
        try {
            const jsonData = await Utils.readFileAsText(file);
            const success = storageService.importUserData(jsonData);
            
            if (success) {
                UIComponents.showToast('Data imported successfully!', 'success');
                UIComponents.updateReviewsDisplay();
                // Refresh current view
                await this.navigateToSection(this.currentSection);
            } else {
                UIComponents.showToast('Failed to import data', 'error');
            }
        } catch (error) {
            console.error('Failed to import data:', error);
            UIComponents.showToast('Invalid data file', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.movieSphereApp = new MovieSphereApp();

    // Add some developer console helpers
    if (typeof console !== 'undefined') {
        console.log('%c🎬 MovieSphere v1.0', 'color: #3b82f6; font-size: 20px; font-weight: bold;');
        console.log('%cDeveloper Tools:', 'color: #10b981; font-weight: bold;');
        console.log('movieSphereApp.getStats() - Get application statistics');
        console.log('movieSphereApp.exportUserData() - Export user data');
        console.log('storageService.clearAllData() - Clear all user data');
        console.log('apiService.clearCache() - Clear API cache');
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MovieSphereApp };
}
