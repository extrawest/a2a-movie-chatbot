# A2A Protocol Movie Agent

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)]()
[![Maintaner](https://img.shields.io/static/v1?label=Oleksandr%20Samoilenko&message=Maintainer&color=red)](mailto:oleksandr.samoilenko@extrawest.com)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)]()
![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)
![GitHub release](https://img.shields.io/badge/release-v1.0.0-blue)

A sophisticated movie information chatbot built using the Agent-to-Agent (A2A) protocol with Google's Genkit AI framework. This project demonstrates advanced AI agent capabilities with real-time movie data retrieval, quote generation, and interactive conversation management through both server APIs and command-line interface.

## 🚀 Features

-   **Intelligent Movie Search**: Advanced movie information retrieval using TMDB API
-   **Actor & People Search**: Comprehensive database of actors, directors, and film industry professionals
-   **Movie Quote Integration**: Contextual movie quotes from extensive quote database
-   **A2A Protocol Implementation**: Modern agent-to-agent communication protocol
-   **Streaming Responses**: Real-time message streaming for immediate feedback
-   **Context Management**: Persistent conversation context across multiple interactions
-   **Command-Line Interface**: Terminal-based chat client for easy interaction
-   **RESTful API**: Express.js server with A2A protocol endpoints

## 🛠 Technology Stack

### Backend

-   **Node.js**: Runtime environment with ES modules
-   **Google Genkit**: AI framework with Gemini 2.0 Flash model
-   **A2A SDK**: Agent-to-Agent protocol implementation
-   **TMDB API**: The Movie Database integration for film data
-   **Quote API**: Movie quotes from pythonanywhere.com

### AI & Processing

-   **Gemini 2.0 Flash**: Large language model for natural conversation
-   **Function Calling**: AI tool integration for dynamic data retrieval
-   **Streaming Processing**: Real-time response generation
-   **Context Awareness**: Multi-turn conversation handling
-   **Tool Integration**: Parallel function execution capabilities

## 📋 Prerequisites

-   Node.js (v18 or higher)
-   npm or pnpm package manager
-   Git
-   TMDB API key (free registration at [TMDB](https://developer.themoviedb.org/docs/getting-started))
-   Google Gemini API key

## 🔧 Installation

### Environment Setup

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd project_name
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:
    ```bash
    export GEMINI_API_KEY=<your_gemini_api_key>
    export TMDB_API_KEY=<your_tmdb_api_key>
    ```

### Running the Application

1. Start the Movie Agent server:

    ```bash
    npm run agents:movie-agent
    ```

    The server will start on `http://localhost:41241`

2. In a separate terminal, start the CLI client:
    ```bash
    npm run a2a:cli
    ```

## 🏗 Project Structure

```
.
├── src/
│   ├── agents/
│   │   ├── movie-agent/
│   │   │   ├── index.ts              # Main agent server implementation
│   │   │   ├── genkit.ts             # Google Genkit AI configuration
│   │   │   ├── tools.ts              # AI tools (movie search, people search, quotes)
│   │   │   ├── tmdb.ts               # TMDB API integration
│   │   │   ├── movie_agent.prompt    # AI agent prompt template
│   │   │   └── README.md             # Agent-specific documentation
│   │   └── README.md                 # Agents overview
│   └── cli.ts                        # Command-line interface client
├── package.json                      # Node.js dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Project documentation
```

## 📱 Features Overview

### Movie Agent Capabilities

-   **Movie Information Retrieval**: Search for movies by title with detailed information including:
    -   Plot summaries and release dates
    -   Cast and crew information
    -   Ratings and reviews
    -   Poster and backdrop images
-   **People Search**: Find information about actors, directors, and industry professionals:
    -   Biographical information
    -   Filmography and known works
    -   Profile images and career highlights
-   **Quote Integration**: Contextual movie quotes related to:
    -   Specific movies being discussed
    -   Actors and their memorable lines
    -   Random inspirational movie quotes

### A2A Protocol Features

-   **Task Management**: Advanced task lifecycle with states:

    -   `submitted` → `working` → `completed`/`input-required`/`failed`
    -   Task cancellation and error handling
    -   Context preservation across interactions

-   **Message Streaming**: Real-time communication with:

    -   Status updates during processing
    -   Artifact delivery for complex responses
    -   Event-driven architecture

-   **Context Awareness**: Intelligent conversation management:
    -   Multi-turn dialogue support
    -   Message history persistence
    -   Context-aware responses

## 🔌 API Endpoints

### A2A Protocol Endpoints

-   `GET /.well-known/agent.json` - Agent card information
-   `POST /a2a/messages` - Send message to agent
-   `GET /a2a/messages/stream` - Streaming message interface
-   `POST /a2a/tasks/{taskId}/cancel` - Cancel active task

### Agent Card Information

```json
{
    "name": "Movie Agent",
    "description": "An agent that can answer questions about movies and actors using TMDB",
    "version": "0.0.2",
    "capabilities": {
        "streaming": true,
        "stateTransitionHistory": true
    },
    "skills": [
        {
            "id": "general_movie_chat",
            "name": "General Movie Chat",
            "examples": [
                "Tell me about the plot of Inception",
                "Find action movies starring Keanu Reeves",
                "Who directed The Matrix?"
            ]
        }
    ]
}
```

## 💬 Usage Examples

### Command Line Interface

```bash
# Start a new conversation
Movie Agent > You: Tell me about Inception

# Search for specific actor
Movie Agent > You: What movies has Leonardo DiCaprio been in?

# Get movie quotes
Movie Agent > You: Give me some quotes from The Matrix

# Use special commands
Movie Agent > You: /new      # Start new session
Movie Agent > You: /exit     # Quit application
```

### Conversation Flow

1. **User Message**: Send question about movies/actors
2. **Agent Processing**: AI searches TMDB and quote databases
3. **Tool Execution**: Parallel function calls for comprehensive data
4. **Response Generation**: AI synthesizes information with quotes
5. **Context Preservation**: Conversation history maintained for follow-ups

## 🎯 AI Tools & Capabilities

### Movie Search Tool

-   **Function**: `searchMovies(query: string)`
-   **Purpose**: Search TMDB database for movies by title
-   **Returns**: Movie details, ratings, cast, images

### People Search Tool

-   **Function**: `searchPeople(query: string)`
-   **Purpose**: Find actors, directors, and film professionals
-   **Returns**: Biographical data, filmography, profile images

### Quote Search Tool

-   **Function**: `searchQuotes(query: string)`
-   **Purpose**: Find memorable quotes related to movies or actors
-   **Returns**: Curated collection of relevant movie quotes

## 🚦 Getting Started

1. **Obtain API Keys**:

    - Register at [TMDB](https://developer.themoviedb.org/docs/getting-started) for movie data
    - Get Google Gemini API key for AI capabilities

2. **Quick Start**:

    ```bash
    # Install and setup
    npm install
    export GEMINI_API_KEY=your_key
    export TMDB_API_KEY=your_key

    # Run the movie agent
    npm run agents:movie-agent

    # In new terminal, start CLI
    npm run a2a:cli
    ```

3. **Try These Examples**:
what are the most popular movies with Leonardo DiCaprio
    - "What's the plot of The Dark Knight?"
    - "Tell me about Christopher Nolan's films"
    - "Give me quotes from Star Wars"

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

Created by Oleksandr Samoilenko  
[Extrawest.com](https://extrawest.com), 2025
