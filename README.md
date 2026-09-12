# NovelNest 📚

NovelNest is a comprehensive, full-stack platform for book lovers to discover, read, discuss, and interact. It features a modern web interface, real-time messaging, intelligent recommendations, and an integrated chess playground for community engagement.

## Architecture

NovelNest is built using a microservices architecture to ensure scalability and separation of concerns:

- **Front-end (`/front-end`)**: Built with Next.js 15, React 19, Tailwind CSS 4, and Radix UI. It delivers a fast, responsive, and aesthetically pleasing user experience.
- **Back-end (`/back-end`)**: A performant Go-based API handling core business logic, user management, and data persistence.
- **Real-time Service (`/real-time-service`)**: A Node.js service utilizing Socket.io for live chat, direct messaging, and real-time community interactions.
- **Recommendation Service (`/recommendation-service`)**: A Python (FastAPI) service providing personalized book recommendations using machine learning.
- **Scraping Service (`/scraping-service`)**: A dedicated service for gathering book metadata and content from various sources.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Framer Motion, Radix UI
- **Backend**: Go
- **Real-time**: Node.js, Express, Socket.io
- **AI/ML & Data**: Python, FastAPI
- **Database & Auth**: Supabase (PostgreSQL), Drizzle ORM

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Go](https://golang.org/) (v21 or higher recommended)
- [Python](https://www.python.org/) (v3.11 or higher)
- [Supabase Account](https://supabase.com/) for Database and Authentication

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/NovelNest.git
   cd NovelNest
   ```

2. **Install root dependencies:**
   ```bash
   npm install
   ```

3. **Install dependencies for individual services:**
   You will need to install dependencies within the `front-end/novel-nest-books`, `real-time-service`, and `recommendation-service` directories according to their respective package managers (`npm install`, `pip install -r requirements.txt`, etc.).

4. **Set up environment variables:**
   Ensure you configure the `.env` files for each respective service. You will need Supabase credentials (URL and Anon Key) and any other required API keys.

5. **Run the development servers:**
   NovelNest uses `concurrently` to run all services simultaneously. From the root directory, simply run:
   ```bash
   npm run dev
   ```
   This command automatically spins up:
   - Frontend Server (Next.js)
   - Backend Server (Go)
   - Real-time Service (Node.js)
   - Recommendation Service (FastAPI)

## 📁 Project Structure

```text
NovelNest/
├── back-end/                # Go-based core API
├── front-end/               # Next.js 15 Web Application
│   └── novel-nest-books/    # Main Frontend application
├── real-time-service/       # Node.js/Socket.io messaging service
├── recommendation-service/  # Python/FastAPI AI recommendations
├── scraping-service/        # Book data scraping service
└── package.json             # Root workspace scripts & dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue to improve the project.

## License

This project is licensed under the MIT License.
