import os
import sqlite3
import requests
from lxml import html

def download_image(image_url, save_folder, file_name):
    """
    Downloads an image from a given URL and saves it to the specified folder with the given file name.
    
    Parameters:
    - image_url: str, the URL of the image to download.
    - save_folder: str, the directory where the image should be saved.
    - file_name: str, the name of the file to save the image as.
    """
    os.makedirs(save_folder, exist_ok=True)
    file_path = os.path.join(save_folder, file_name)
    
    try:
        response = requests.get(image_url)
        response.raise_for_status()
        
        with open(file_path, 'wb') as file:
            file.write(response.content)
        print(f"Image successfully downloaded and saved to {file_path}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to download the image for {file_name}. Error: {e}")

def fetch_movies_from_db(db_path):
    """
    Fetches movie data from the database.
    
    Parameters:
    - db_path: str, the path to the SQLite database.
    
    Returns:
    - List of tuples containing movie title and Rotten Tomatoes link.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT title, link FROM movies")
    movies = cursor.fetchall()
    
    conn.close()
    return movies

def extract_poster_url(rt_link):
    """
    Extracts the poster image URL from a Rotten Tomatoes movie page using the provided XPath.
    
    Parameters:
    - rt_link: str, the URL of the Rotten Tomatoes movie page.
    
    Returns:
    - str, the URL of the poster image.
    """
    try:
        print(f"Accessing {rt_link}...")
        response = requests.get(rt_link)
        response.raise_for_status()
        
        tree = html.fromstring(response.content)
        rt_img_tag = tree.xpath('//rt-img[@alt="poster image"]')
        
        if rt_img_tag and 'src' in rt_img_tag[0].attrib:
            poster_url = rt_img_tag[0].attrib['src']
            print(f"Poster URL found: {poster_url}")
            return poster_url
        else:
            print(f"Poster image not found on page: {rt_link}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Failed to access {rt_link}. Error: {e}")
        return None

def main():
    db_path = 'movie_ratings.db'
    save_folder = './movie_posters'
    
    movies = fetch_movies_from_db(db_path)
    
    for title, link in movies:
        print(f"Processing {title}...")
        poster_url = extract_poster_url(link)
        if poster_url:
            # Download the image from the poster URL
            download_image(poster_url, save_folder, f"{title}.jpg")
        else:
            print(f"No poster found for {title}.")

if __name__ == "__main__":
    main()
