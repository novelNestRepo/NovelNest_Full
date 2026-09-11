import requests
from bs4 import BeautifulSoup
import json
import os

# Example scraper for Hindawi Foundation (Open-Source Egyptian/Arabic Books)
BASE_URL = "https://www.hindawi.org"
BOOKS_URL = f"{BASE_URL}/books/categories/novels/" # Novels category

def scrape_books(page=1):
    books = []
    url = f"{BOOKS_URL}{page}/"
    print(f"Scraping {url}...")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to fetch {url}: {e}")
        return books

    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Depending on Hindawi's layout, find book elements
    book_elements = soup.select('div.bookList ul li')
    
    for element in book_elements:
        try:
            title_el = element.select_one('h2.title a')
            author_el = element.select_one('h3.author a')
            img_el = element.select_one('img')
            
            if title_el:
                title = title_el.text.strip()
                link = BASE_URL + title_el['href']
                author = author_el.text.strip() if author_el else "Unknown"
                image_url = BASE_URL + img_el['src'] if img_el else None
                
                books.append({
                    "title": title,
                    "author": author,
                    "link": link,
                    "cover_image": image_url,
                    "source": "Hindawi",
                    "language": "ar",
                    "origin": "Egypt/Arab"
                })
        except Exception as e:
            print(f"Error parsing a book element: {e}")
            continue
            
    return books

def save_to_json(data, filename="books.json"):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Saved {len(data)} books to {filename}")

if __name__ == "__main__":
    all_books = []
    # Scrape first 2 pages as a test
    for i in range(1, 3):
        page_books = scrape_books(page=i)
        all_books.extend(page_books)
        
    save_to_json(all_books, "egyptian_books_data.json")
    print("Scraping completed. Data is ready for Supabase ingestion.")
