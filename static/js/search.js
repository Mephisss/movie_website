// Enhanced search functionality with debouncing and better UX
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const movieTiles = document.querySelectorAll('.movie-tile');
    const movieGrid = document.getElementById('movieGrid');
    let searchTimeout;
    let noResultsElement = null;

    if (!searchInput || !movieTiles.length) {
        console.warn('Search elements not found');
        return;
    }

    // Create no results element
    function createNoResultsElement() {
        if (noResultsElement) return noResultsElement;
        
        noResultsElement = document.createElement('div');
        noResultsElement.className = 'no-results';
        noResultsElement.innerHTML = `
            <h3>No movies found</h3>
            <p>Try a different search term or browse all movies</p>
        `;
        return noResultsElement;
    }

    // Show/hide no results message
    function toggleNoResults(show) {
        if (show && !document.querySelector('.no-results')) {
            movieGrid.appendChild(createNoResultsElement());
        } else if (!show && document.querySelector('.no-results')) {
            document.querySelector('.no-results').remove();
        }
    }

    // Highlight search terms in movie titles
    function highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark style="background: var(--accent-color); color: white; padding: 2px 4px; border-radius: 3px;">$1</mark>');
    }

    // Reset highlights
    function resetHighlights() {
        movieTiles.forEach(tile => {
            const titleElement = tile.querySelector('h4');
            if (titleElement) {
                const originalTitle = titleElement.dataset.originalTitle || titleElement.textContent;
                titleElement.dataset.originalTitle = originalTitle;
                titleElement.innerHTML = originalTitle;
            }
        });
    }

    // Perform search
    function performSearch(searchTerm) {
        const normalizedTerm = searchTerm.toLowerCase().trim();
        let visibleCount = 0;

        // Reset previous highlights
        resetHighlights();

        movieTiles.forEach((tile, index) => {
            const titleElement = tile.querySelector('h4');
            const movieTitle = tile.dataset.title || titleElement.textContent.toLowerCase();
            
            if (!normalizedTerm || movieTitle.includes(normalizedTerm)) {
                // Show tile with animation
                tile.style.display = 'block';
                tile.style.animation = `fadeIn 0.5s ease ${index * 0.05}s both`;
                
                // Highlight search term
                if (normalizedTerm && titleElement) {
                    const originalTitle = titleElement.dataset.originalTitle || titleElement.textContent;
                    titleElement.innerHTML = highlightSearchTerm(originalTitle, normalizedTerm);
                }
                
                visibleCount++;
            } else {
                // Hide tile
                tile.style.display = 'none';
                tile.style.animation = 'none';
            }
        });

        // Show/hide no results message
        toggleNoResults(visibleCount === 0 && normalizedTerm);

        // Update URL without triggering page reload
        if (normalizedTerm) {
            const url = new URL(window.location);
            url.searchParams.set('search', normalizedTerm);
            window.history.replaceState({}, '', url);
        } else {
            const url = new URL(window.location);
            url.searchParams.delete('search');
            window.history.replaceState({}, '', url);
        }
    }

    // Setup event listener with debouncing
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Add loading state
        searchInput.style.background = 'rgba(37, 37, 37, 0.6)';
        
        // Debounce search to avoid excessive filtering
        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
            
            // Remove loading state
            searchInput.style.background = '';
        }, 300);
    });

    // Handle enter key for search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            performSearch(e.target.value);
        }
    });

    // Setup clear search functionality
    function setupClearSearch() {
        const clearButton = document.createElement('button');
        clearButton.innerHTML = '✕';
        clearButton.className = 'search-clear';
        clearButton.style.cssText = `
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 18px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 10;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            performSearch('');
            clearButton.style.opacity = '0';
            searchInput.focus();
        });

        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(clearButton);

        // Show/hide clear button based on input content
        searchInput.addEventListener('input', (e) => {
            clearButton.style.opacity = e.target.value ? '1' : '0';
        });
    }

    setupClearSearch();

    // Initialize search from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get('search');
    if (initialSearch) {
        searchInput.value = initialSearch;
        performSearch(initialSearch);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Focus search on '/' key
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Clear search on Escape key when focused
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.value = '';
            performSearch('');
            searchInput.blur();
        }
    });

    // Add search shortcut hint
    searchInput.placeholder = 'Search for movies... (Press / to focus)';

    console.log('Enhanced search functionality initialized');
}

// Advanced filtering and sorting functionality
function setupAdvancedFilters() {
    const movieGrid = document.getElementById('movieGrid');
    if (!movieGrid) return;

    // Create filter controls
    function createFilterControls() {
        const existingControls = document.querySelector('.filter-controls');
        if (existingControls) return;

        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-controls';
        filterContainer.style.cssText = `
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            align-items: center;
            padding: 1rem;
            background: rgba(37, 37, 37, 0.5);
            border-radius: var(--border-radius);
            backdrop-filter: blur(10px);
        `;

        // Sort dropdown
        const sortSelect = document.createElement('select');
        sortSelect.className = 'sort-select';
        sortSelect.innerHTML = `
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="rating-asc">Rating (Low to High)</option>
            <option value="reviews-desc">Most Reviewed</option>
            <option value="reviews-asc">Least Reviewed</option>
        `;
        sortSelect.style.cssText = `
            background: rgba(26, 26, 26, 0.8);
            color: var(--text-primary);
            border: 1px solid rgba(255, 107, 53, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
        `;

        const sortLabel = document.createElement('label');
        sortLabel.textContent = 'Sort by:';
        sortLabel.style.cssText = `
            color: var(--text-secondary);
            font-weight: 500;
        `;

        filterContainer.appendChild(sortLabel);
        filterContainer.appendChild(sortSelect);

        // Insert before movie grid
        const section = movieGrid.parentElement;
        const sectionTitle = section.querySelector('.section-title');
        section.insertBefore(filterContainer, sectionTitle.nextSibling);

        // Handle sorting
        sortSelect.addEventListener('change', (e) => {
            sortMovies(e.target.value);
        });
    }

    // Sort movies function
    function sortMovies(sortBy) {
        const tiles = Array.from(document.querySelectorAll('.movie-tile:not(.no-results)'));
        
        tiles.sort((a, b) => {
            const titleA = a.querySelector('h4').textContent.trim();
            const titleB = b.querySelector('h4').textContent.trim();
            const ratingA = parseFloat(a.querySelector('.rating-badge')?.textContent || '0');
            const ratingB = parseFloat(b.querySelector('.rating-badge')?.textContent || '0');
            const reviewsA = parseInt(a.querySelector('.rating-count')?.textContent.match(/\d+/)?.[0] || '0');
            const reviewsB = parseInt(b.querySelector('.rating-count')?.textContent.match(/\d+/)?.[0] || '0');

            switch (sortBy) {
                case 'title-asc':
                    return titleA.localeCompare(titleB);
                case 'title-desc':
                    return titleB.localeCompare(titleA);
                case 'rating-desc':
                    return ratingB - ratingA;
                case 'rating-asc':
                    return ratingA - ratingB;
                case 'reviews-desc':
                    return reviewsB - reviewsA;
                case 'reviews-asc':
                    return reviewsA - reviewsB;
                default:
                    return 0;
            }
        });

        // Re-append sorted tiles
        tiles.forEach((tile, index) => {
            movieGrid.appendChild(tile);
            tile.style.animation = `fadeIn 0.5s ease ${index * 0.03}s both`;
        });
    }

    createFilterControls();
}

// Initialize all search and filter functionality
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupAdvancedFilters();
});