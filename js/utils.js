// Utility Functions Module
class Utils {
    // Debounce function for search optimization
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for scroll events
    static throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function executedFunction(...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    // Format date strings
    static formatDate(dateString, format = 'short') {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const options = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            year: { year: 'numeric' }
        };
        
        return date.toLocaleDateString('en-US', options[format] || options.short);
    }

    // Format runtime minutes to hours and minutes
    static formatRuntime(minutes) {
        if (!minutes || minutes <= 0) return 'Unknown';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    // Truncate text with ellipsis
    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // Clean and format movie title
    static formatMovieTitle(title) {
        if (!title) return 'Unknown Title';
        return title.trim().replace(/\s+/g, ' ');
    }

    // Format year from date string
    static getYearFromDate(dateString) {
        if (!dateString) return 'Unknown';
        const year = new Date(dateString).getFullYear();
        return isNaN(year) ? 'Unknown' : year.toString();
    }

    // Create slug from string
    static createSlug(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Sanitize HTML to prevent XSS
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = Utils.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    // Check if element is in viewport
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Smooth scroll to element
    static scrollToElement(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }

    // Get random items from array
    static getRandomItems(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // Format large numbers (e.g., 1000 -> 1K)
    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Get relative time string
    static getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        const year = 365 * day;
        
        if (diff < minute) return 'Just now';
        if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
        if (diff < day) return `${Math.floor(diff / hour)}h ago`;
        if (diff < week) return `${Math.floor(diff / day)}d ago`;
        if (diff < month) return `${Math.floor(diff / week)}w ago`;
        if (diff < year) return `${Math.floor(diff / month)}mo ago`;
        return `${Math.floor(diff / year)}y ago`;
    }

    // Convert rating to star string
    static ratingToStars(rating, maxRating = 5) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    // Local storage availability check
    static isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Get device type
    static getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // Check if user prefers reduced motion
    static prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                textArea.remove();
                return success;
            }
        } catch (error) {
            console.error('Failed to copy text to clipboard:', error);
            return false;
        }
    }

    // Download data as JSON file
    static downloadJSON(data, filename = 'data.json') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Read file as text
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    }

    // Validate movie data structure
    static validateMovieData(movie) {
        const requiredFields = ['id', 'title'];
        return requiredFields.every(field => movie && movie[field] !== undefined);
    }

    // Parse search query for advanced filters
    static parseSearchQuery(query) {
        const parsed = {
            text: query,
            year: null,
            genre: null,
            rating: null
        };
        
        // Extract year (e.g., "avengers 2018")
        const yearMatch = query.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            parsed.year = parseInt(yearMatch[0]);
            parsed.text = query.replace(yearMatch[0], '').trim();
        }
        
        return parsed;
    }
}

// Animation utilities
class AnimationUtils {
    // Fade in element
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    // Fade out element
    static fadeOut(element, duration = 300) {
        const start = performance.now();
        const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = initialOpacity * (1 - progress);
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    // Slide in from bottom
    static slideInUp(element, duration = 300) {
        element.style.transform = 'translateY(100%)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            element.style.transform = `translateY(${100 * (1 - easeOut)}%)`;
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.transform = '';
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, AnimationUtils };
}
