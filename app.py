import os
import sqlite3
from flask import Flask, render_template, abort, url_for

app = Flask(__name__)

# Function to fetch movies from the database
def get_movies():
    conn = sqlite3.connect('movie_ratings.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, link FROM movies")
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

    # Fetch the ratings for this movie
    cursor.execute("""
        SELECT u.name, r.rating 
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.movie_id = ?
    """, (movie_id,))
    ratings = cursor.fetchall()
    conn.close()

    # Add the title again to the tuple for the poster filename
    movie = (movie[0], movie[1], movie[0])  # movie = (title, link, title)

    return movie, ratings

@app.route('/')
def index():
    movies = get_movies()
    return render_template('index.html', movies=movies)

@app.route('/movie/<int:movie_id>')
def movie_detail(movie_id):
    movie_details = get_movie_details(movie_id)
    if movie_details is None:
        abort(404)
    movie, ratings = movie_details
    return render_template('movie_detail.html', movie=movie, ratings=ratings)

if __name__ == '__main__':
    # Bind to 0.0.0.0 and use the PORT environment variable if provided
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', 10000))  # Default to 10000 if PORT is not set
    app.run(host=host, port=port)