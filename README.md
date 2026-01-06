# Avocato Movies
VIEW DEMO > https://movie-website-ug1o.onrender.com/

Movie rating tracker with Rotten Tomatoes integration. Flask web application for groups to track and compare movie ratings.

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0+-green)
![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Movie catalog** with poster scraping from Rotten Tomatoes
- **Multi-user ratings** with per-user tracking
- **Top Rated page** showing films with 2+ ratings
- **Live search** with debounced filtering
- **Rating statistics**: average, min, max, total count
- **Responsive design** with particle background effects
- **Direct RT links** for each movie entry

## Stack

| Component | Technology |
|-----------|------------|
| Backend | Flask |
| Database | SQLite |
| Frontend | Jinja2, Vanilla JS |
| Styling | CSS Variables, Inter font |
| Scraping | lxml, requests |

## Project Structure

```
avocato-movies/
├── app.py              # Main Flask application
├── this.py             # Poster scraper (RT integration)
├── web.py              # Simplified Flask variant
├── movie_ratings.db    # SQLite database
├── static/
│   ├── style.css       # Global styles
│   ├── logo.png        # Site logo
│   ├── js/
│   │   ├── particles.js    # Background animation
│   │   └── search.js       # Search + filtering
│   └── movie_posters/      # Downloaded posters
└── templates/
    ├── index.html          # Home/browse page
    ├── movie_detail.html   # Single movie view
    └── top_rated.html      # Leaderboard
```

## Database Schema

```sql
movies (id INTEGER PRIMARY KEY, title TEXT, link TEXT UNIQUE)
users (id INTEGER PRIMARY KEY, name TEXT)
ratings (movie_id INTEGER, user_id INTEGER, rating INTEGER, PRIMARY KEY (movie_id, user_id))
```

## Setup

```bash
# Clone
git clone https://github.com/yourusername/avocato-movies.git
cd avocato-movies

# Install dependencies
pip install flask requests lxml

# Run
python app.py
```

Server starts at `http://localhost:5000`

## Poster Scraping

Run `this.py` to download movie posters from Rotten Tomatoes:

```bash
python this.py
```

Posters saved to `static/movie_posters/` as `{movie_title}.jpg`

## Routes

| Route | Description |
|-------|-------------|
| `/` | Browse all movies |
| `/movie/<id>` | Movie detail + ratings |
| `/top-rated` | Top 20 (min 2 ratings) |
| `/api/search/<query>` | JSON search endpoint |

## Configuration

Environment variables:

- `PORT` - Server port (default: 5000)
- `FLASK_ENV` - Set to `development` for debug mode

## License

MIT
