import os
import sqlite3
from flask import Flask, render_template, abort, url_for, jsonify

app = Flask(__name__)

# Function to check database schema and handle missing columns gracefully
def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table."""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [column[1] for column in cursor.fetchall()]
    return column_name in columns

# Function to fetch movies from the database with additional info
def get_movies():
    conn = sqlite3.connect('movie_ratings.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT m.id, m.title, m.link,
               ROUND(AVG(r.rating), 1) as avg_rating,
               COUNT(r.rating) as rating_count
        FROM movies m
        LEFT JOIN ratings r ON m.id = r.movie_id
        GROUP BY m.id, m.title, m.link
        ORDER BY avg_rating DESC NULLS LAST
    """)
    movies = cursor.fetchall()
    conn.close()
    return movies

# Function to fetch movie details and ratings
def get_movie_details(movie_id):
    conn = sqlite3.connect('movie_ratings.db')
    cursor = conn.cursor()

    # Fetch the movie details (title and link)
    cursor.execute("SELECT title, link FROM movies WHERE id = ?", (movie_id,))
    movie = cursor.fetchone()

    if not movie:
        conn.close()
        return None

    # Check if created_at column exists in ratings table
    has_created_at = check_column_exists(cursor, 'ratings', 'created_at')
    
    # Fetch the ratings for this movie with conditional created_at
    if has_created_at:
        cursor.execute("""
            SELECT u.name, r.rating, r.created_at
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.movie_id = ?
            ORDER BY r.rating DESC, r.created_at DESC
        """, (movie_id,))
    else:
        cursor.execute("""
            SELECT u.name, r.rating, NULL as created_at
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.movie_id = ?
            ORDER BY r.rating DESC
        """, (movie_id,))
    
    ratings = cursor.fetchall()
    conn.close()

    # Calculate statistics
    if ratings:
        rating_values = [r[1] for r in ratings]
        avg_rating = round(sum(rating_values) / len(rating_values), 1)
        max_rating = max(rating_values)
        min_rating = min(rating_values)
    else:
        avg_rating = 0
        max_rating = 0
        min_rating = 0

    # Create movie tuple with stats
    movie_data = {
        'title': movie[0],
        'link': movie[1],
        'poster_filename': movie[0],
        'avg_rating': avg_rating,
        'max_rating': max_rating,
        'min_rating': min_rating,
        'total_ratings': len(ratings)
    }

    return movie_data, ratings

# API endpoint for search
@app.route('/api/search/<query>')
def search_movies(query):
    conn = sqlite3.connect('movie_ratings.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT m.id, m.title, m.link,
               ROUND(AVG(r.rating), 1) as avg_rating,
               COUNT(r.rating) as rating_count
        FROM movies m
        LEFT JOIN ratings r ON m.id = r.movie_id
        WHERE m.title LIKE ?
        GROUP BY m.id, m.title, m.link
        ORDER BY avg_rating DESC NULLS LAST
    """, (f'%{query}%',))
    movies = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': movie[0],
        'title': movie[1],
        'link': movie[2],
        'avg_rating': movie[3] or 0,
        'rating_count': movie[4]
    } for movie in movies])

@app.route('/')
def index():
    try:
        movies = get_movies()
        return render_template('index.html', movies=movies)
    except Exception as e:
        print(f"Error in index route: {e}")
        return render_template('index.html', movies=[])

@app.route('/movie/<int:movie_id>')
def movie_detail(movie_id):
    try:
        movie_details = get_movie_details(movie_id)
        if movie_details is None:
            abort(404)
        movie, ratings = movie_details
        return render_template('movie_detail.html', movie=movie, ratings=ratings)
    except Exception as e:
        print(f"Error in movie_detail route: {e}")
        abort(500)

@app.route('/top-rated')
def top_rated():
    try:
        conn = sqlite3.connect('movie_ratings.db')
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.id, m.title, m.link,
                   ROUND(AVG(r.rating), 1) as avg_rating,
                   COUNT(r.rating) as rating_count
            FROM movies m
            INNER JOIN ratings r ON m.id = r.movie_id
            GROUP BY m.id, m.title, m.link
            HAVING COUNT(r.rating) >= 2
            ORDER BY avg_rating DESC, rating_count DESC
            LIMIT 20
        """)
        movies = cursor.fetchall()
        conn.close()
        return render_template('top_rated.html', movies=movies)
    except Exception as e:
        print(f"Error in top_rated route: {e}")
        return render_template('top_rated.html', movies=[])

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Bind to 0.0.0.0 and use the PORT environment variable if provided
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', 5000))  # Default to 5000 for local development
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host=host, port=port, debug=debug)