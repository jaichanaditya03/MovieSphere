// UI Components Module
class UIComponents {
    // Create movie card element
    static createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('data-movie-id', movie.id);

        const posterURL = apiService.getImageURL(movie.poster_path, 'SMALL');
        const year = Utils.getYearFromDate(movie.release_date);
        const userRating = storageService.getUserRating(movie.id);

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${posterURL}" alt="${Utils.sanitizeHTML(movie.title)}" class="poster-image" loading="lazy">
                <div class="movie-overlay">
                    <button class="btn-primary view-details">View Details</button>
                </div>
            </div>
            <div class="movie-info">
                <h4 class="movie-title">${Utils.sanitizeHTML(movie.title)}</h4>
                <p class="movie-year">${year}</p>
                <div class="movie-rating">
                    <div class="stars" data-movie-id="${movie.id}">
                        ${this.createStarRating(userRating?.rating || 0)}
                    </div>
                    <span class="rating-text">${userRating?.rating || 0}/5</span>
                </div>
            </div>
        `;

        // Add click event for viewing details
        const viewDetailsBtn = card.querySelector('.view-details');
        viewDetailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMovieModal(movie.id);
        });

        // Add click event for the card itself
        card.addEventListener('click', () => {
            this.showMovieModal(movie.id);
        });

        // Add star rating event listeners
        this.addStarRatingEvents(card.querySelector('.stars'));

        return card;
    }

    // Create star rating HTML
    static createStarRating(rating) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            const isActive = i <= rating;
            starsHTML += `<span class="star ${isActive ? 'active' : ''}" data-rating="${i}">⭐</span>`;
        }
        return starsHTML;
    }

    // Add star rating event listeners
    static addStarRatingEvents(starsContainer) {
        const stars = starsContainer.querySelectorAll('.star');
        const movieId = starsContainer.getAttribute('data-movie-id');

        stars.forEach((star, index) => {
            star.addEventListener('mouseenter', () => {
                // Highlight stars up to hovered star
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i <= index);
                });
            });

            star.addEventListener('mouseleave', () => {
                // Reset to actual rating
                const currentRating = storageService.getUserRating(movieId)?.rating || 0;
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i < currentRating);
                });
            });

            star.addEventListener('click', (e) => {
                e.stopPropagation();
                const rating = parseInt(star.getAttribute('data-rating'));
                this.setMovieRating(movieId, rating);
                
                // Update visual feedback
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i < rating);
                });
                
                // Update rating text
                const ratingText = starsContainer.closest('.movie-rating').querySelector('.rating-text');
                if (ratingText) {
                    ratingText.textContent = `${rating}/5`;
                }
                
                // Show success message
                this.showToast('Rating saved!', 'success');
            });
        });
    }

    // Set movie rating
    static setMovieRating(movieId, rating) {
        storageService.setUserRating(movieId, rating);
        
        // Update all instances of this movie's rating on the page
        document.querySelectorAll(`[data-movie-id="${movieId}"] .stars`).forEach(starsContainer => {
            const stars = starsContainer.querySelectorAll('.star');
            stars.forEach((star, index) => {
                star.classList.toggle('active', index < rating);
            });
            
            const ratingText = starsContainer.closest('.movie-rating')?.querySelector('.rating-text');
            if (ratingText) {
                ratingText.textContent = `${rating}/5`;
            }
        });
    }

    // Create loading skeleton
    static createLoadingSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'movie-card skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-poster"></div>
            <div class="skeleton-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-year"></div>
                <div class="skeleton-rating"></div>
            </div>
        `;
        return skeleton;
    }

    // Show loading state
    static showLoading(container, count = 8) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createLoadingSkeleton());
        }
    }

    // Hide loading overlay
    static hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    // Show loading overlay
    static showLoadingOverlay(message = 'Loading...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.querySelector('p').textContent = message;
            loading.classList.remove('hidden');
        }
    }

    // Show movie modal
    static async showMovieModal(movieId) {
        try {
            this.showLoadingOverlay('Loading movie details...');
            
            const movieData = await apiService.getFullMovieData(movieId);
            const modal = document.getElementById('movie-modal');
            const modalBody = document.getElementById('modal-body');
            
            modalBody.innerHTML = this.createMovieDetailHTML(movieData);
            
            // Add event listeners
            this.addMovieDetailEvents(movieData);
            
            // Show modal
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load movie details:', error);
            this.showToast('Failed to load movie details', 'error');
            this.hideLoading();
        }
    }

    // Create movie detail HTML
    static createMovieDetailHTML(movie) {
        const posterURL = apiService.getImageURL(movie.poster_path, 'LARGE');
        const year = Utils.getYearFromDate(movie.release_date);
        const runtime = Utils.formatRuntime(movie.runtime);
        const genres = movie.genres?.map(g => g.name).join(', ') || 'Unknown';
        const director = movie.credits?.crew?.find(person => person.job === 'Director')?.name || 'Unknown';
        const cast = movie.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'Unknown';
        const userRating = storageService.getUserRating(movie.id);
        const userReview = storageService.getUserReview(movie.id);

        return `
            <div class="movie-detail">
                <div class="movie-detail-header">
                    <div class="movie-poster-large">
                        <img src="${posterURL}" alt="${Utils.sanitizeHTML(movie.title)}" class="poster-large">
                    </div>
                    <div class="movie-meta">
                        <h2 class="movie-title-large">${Utils.sanitizeHTML(movie.title)}</h2>
                        <div class="movie-subtitle">
                            <span class="year">${year}</span>
                            <span class="runtime">${runtime}</span>
                            <span class="genre">${Utils.sanitizeHTML(genres)}</span>
                        </div>
                        <div class="ratings-container">
                            <div class="imdb-rating">
                                <span class="rating-label">IMDB</span>
                                <span class="rating-value">${movie.vote_average?.toFixed(1) || 'N/A'}/10</span>
                            </div>
                            <div class="user-rating">
                                <span class="rating-label">Your Rating</span>
                                <div class="star-rating" id="user-star-rating" data-movie-id="${movie.id}">
                                    ${this.createStarRating(userRating?.rating || 0)}
                                </div>
                            </div>
                        </div>
                        <p class="plot">${Utils.sanitizeHTML(movie.overview || 'No plot available.')}</p>
                        <div class="movie-cast">
                            <h4>Cast</h4>
                            <p class="cast-list">${Utils.sanitizeHTML(cast)}</p>
                        </div>
                        <div class="movie-director">
                            <h4>Director</h4>
                            <p class="director-name">${Utils.sanitizeHTML(director)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="movie-detail-body">
                    <div class="reviews-section">
                        <h3>Your Review</h3>
                        ${userReview ? `
                            <div class="existing-review" id="existing-review">
                                <p class="review-content">${Utils.sanitizeHTML(userReview.review)}</p>
                                <div class="review-meta">
                                    <small>Reviewed on ${Utils.formatDate(userReview.timestamp)}</small>
                                </div>
                                <button class="btn-secondary edit-review" id="edit-review">Edit Review</button>
                            </div>
                        ` : ''}
                        <form class="review-form ${userReview ? 'hidden' : ''}" id="review-form">
                            <textarea 
                                class="review-textarea" 
                                id="review-text"
                                placeholder="Write your review..."
                                rows="4"
                            >${userReview ? userReview.review : ''}</textarea>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Save Review</button>
                                ${userReview ? '<button type="button" class="btn-secondary" id="delete-review">Delete Review</button>' : ''}
                                ${userReview ? '<button type="button" class="btn-secondary" id="cancel-edit">Cancel</button>' : ''}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // Add movie detail event listeners
    static addMovieDetailEvents(movieData) {
        // Star rating events
        const starRating = document.getElementById('user-star-rating');
        if (starRating) {
            this.addStarRatingEvents(starRating);
        }

        // Review form events
        const reviewForm = document.getElementById('review-form');
        const editReviewBtn = document.getElementById('edit-review');
        const deleteReviewBtn = document.getElementById('delete-review');
        const cancelEditBtn = document.getElementById('cancel-edit');
        const existingReview = document.getElementById('existing-review');

        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReviewSubmit(movieData);
            });
        }

        if (editReviewBtn) {
            editReviewBtn.addEventListener('click', () => {
                existingReview.classList.add('hidden');
                reviewForm.classList.remove('hidden');
            });
        }

        if (deleteReviewBtn) {
            deleteReviewBtn.addEventListener('click', () => {
                this.handleReviewDelete(movieData.id);
            });
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                reviewForm.classList.add('hidden');
                existingReview.classList.remove('hidden');
            });
        }

        // Modal close events
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');

        if (modalClose) {
            modalClose.addEventListener('click', this.hideModal);
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', this.hideModal);
        }
    }

    // Handle review submission
    static handleReviewSubmit(movieData) {
        const reviewText = document.getElementById('review-text').value.trim();
        const userRating = storageService.getUserRating(movieData.id);

        if (!reviewText) {
            this.showToast('Please write a review', 'error');
            return;
        }

        if (reviewText.length < 10) {
            this.showToast('Review must be at least 10 characters long', 'error');
            return;
        }

        if (!userRating || userRating.rating === 0) {
            this.showToast('Please rate the movie before saving your review', 'error');
            return;
        }

        // Save review
        const success = storageService.setUserReview(movieData.id, reviewText, movieData);
        
        if (success) {
            this.showToast('Review saved successfully!', 'success');
            // Refresh the modal content
            setTimeout(() => {
                this.showMovieModal(movieData.id);
            }, 1000);
        } else {
            this.showToast('Failed to save review', 'error');
        }
    }

    // Handle review deletion
    static handleReviewDelete(movieId) {
        if (confirm('Are you sure you want to delete this review?')) {
            const success = storageService.removeUserReview(movieId);
            
            if (success) {
                this.showToast('Review deleted successfully!', 'success');
                // Refresh the modal content
                setTimeout(() => {
                    this.showMovieModal(movieId);
                }, 1000);
            } else {
                this.showToast('Failed to delete review', 'error');
            }
        }
    }

    // Hide modal
    static hideModal() {
        const modal = document.getElementById('movie-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Show toast notification
    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="toast-content">
                <p class="toast-message">${Utils.sanitizeHTML(message)}</p>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close event
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Add to container
        toastContainer.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    // Remove toast
    static removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'toast-slide-out 0.3s ease-in forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    // Create review card
    static createReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.setAttribute('data-movie-id', review.movieId);

        const posterURL = apiService.getImageURL(review.moviePoster, 'SMALL');
        const formattedDate = Utils.formatDate(review.timestamp);
        const stars = this.createStarRating(review.rating);

        card.innerHTML = `
            <div class="review-header">
                <img src="${posterURL}" alt="${Utils.sanitizeHTML(review.movieTitle)}" class="review-movie-poster">
                <div class="review-meta">
                    <h4 class="review-movie-title">${Utils.sanitizeHTML(review.movieTitle)}</h4>
                    <div class="review-rating">
                        <div class="stars small">${stars}</div>
                        <span class="review-date">${formattedDate}</span>
                    </div>
                </div>
                <button class="review-actions">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            <div class="review-content">
                <p class="review-text">${Utils.sanitizeHTML(review.review)}</p>
            </div>
            <div class="review-footer">
                <button class="btn-text edit-review">Edit</button>
                <button class="btn-text delete-review">Delete</button>
            </div>
        `;

        // Add event listeners
        const editBtn = card.querySelector('.edit-review');
        const deleteBtn = card.querySelector('.delete-review');

        editBtn.addEventListener('click', () => {
            this.showMovieModal(review.movieId);
        });

        deleteBtn.addEventListener('click', () => {
            this.handleReviewDelete(review.movieId);
            card.remove();
        });

        return card;
    }

    // Update reviews display
    static updateReviewsDisplay() {
        const reviewsContainer = document.getElementById('user-reviews');
        if (!reviewsContainer) return;

        const reviews = storageService.getAllUserReviews();
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="empty-state">
                    <h4>No reviews yet</h4>
                    <p>Start rating and reviewing movies to see them here!</p>
                </div>
            `;
            return;
        }

        reviewsContainer.innerHTML = '';
        reviews.forEach(review => {
            reviewsContainer.appendChild(this.createReviewCard(review));
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIComponents };
}
