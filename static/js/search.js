function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const movieTiles = document.querySelectorAll('.movie-tile');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        movieTiles.forEach(tile => {
            const movieTitle = tile.querySelector('h4').textContent.toLowerCase();
            if (movieTitle.includes(searchTerm)) {
                tile.style.display = 'block';
                tile.style.animation = 'fadeIn 0.5s ease';
            } else {
                tile.style.display = 'none';
            }
        });
    });
}