# A2A Protocol Multi-Agent System

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)]()
[![Maintaner](https://img.shields.io/static/v1?label=Oleksandr%20Samoilenko&message=Maintainer&color=red)](mailto:oleksandr.samoilenko@extrawest.com)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)]()
![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)
![GitHub release](https://img.shields.io/badge/release-v1.0.0-blue)

A sophisticated multi-agent system built using the Agent-to-Agent (A2A) protocol with Google's Genkit AI framework. This project demonstrates advanced AI agent coordination capabilities with specialized agents for movie information retrieval, quote generation, and intelligent request routing through a multiagent coordinator.


https://github.com/user-attachments/assets/c14d70f3-2ff2-45fa-8b6d-a15e119ccce5


## 🚀 Features

-   **Multi-Agent Architecture**: Coordinated system with specialized agents for different tasks
-   **Intelligent Movie Search**: Advanced movie information retrieval using TMDB API
-   **Actor & People Search**: Comprehensive database of actors, directors, and film industry professionals
-   **Dedicated Quote Agent**: Specialized agent for contextual movie quotes from extensive database
-   **Smart Request Routing**: Multiagent coordinator that intelligently routes requests to appropriate agents
-   **A2A Protocol Implementation**: Modern agent-to-agent communication protocol
-   **MCP Protocol Support**: Model Context Protocol servers and clients for standardized tool access
-   **Streaming Responses**: Real-time message streaming for immediate feedback
-   **Context Management**: Persistent conversation context across multiple interactions
-   **Command-Line Interface**: Terminal-based chat client for easy interaction with any agent
-   **RESTful APIs**: Express.js servers with A2A protocol endpoints for each agent

## 🏗 System Architecture

This multi-agent system consists of three specialized agents:

1. **Movie Agent** (Port 41241) - Handles movie information, actor details, plots, recommendations
2. **Quotes Agent** (Port 41242) - Specialized in finding and providing movie quotes
3. **Multiagent Coordinator** (Port 41240) - Intelligently routes requests between agents and combines responses

## 🛠 Technology Stack

### Backend

-   **Node.js**: Runtime environment with ES modules
-   **Google Genkit**: AI framework with Gemini 2.0 Flash model
-   **A2A SDK**: Agent-to-Agent protocol implementation
-   **MCP SDK**: Model Context Protocol for standardized tool access
-   **TMDB API**: The Movie Database integration for film data
-   **Quote API**: Movie quotes from pythonanywhere.com

### AI & Processing

-   **Gemini 2.0 Flash**: Large language model for natural conversation
-   **Function Calling**: AI tool integration for dynamic data retrieval
-   **Streaming Processing**: Real-time response generation
-   **Context Awareness**: Multi-turn conversation handling
-   **Tool Integration**: Parallel function execution capabilities

## 🔗 Model Context Protocol (MCP) Integration

This project implements the **Model Context Protocol (MCP)**, a standardized protocol for connecting AI applications with external tools and data sources. MCP enables secure, controlled access to agent capabilities through a unified interface.

### MCP Architecture

Each agent provides both **MCP Server** and **MCP Client** implementations:

-   **MCP Servers**: Expose agent tools as standardized MCP resources that other applications can discover and use
-   **MCP Clients**: Connect to MCP servers to access remote tools and capabilities

### Available MCP Servers

#### Movie Agent MCP Server

-   **Server Name**: `movie-mcp-server`
-   **Available Tools**:
    -   `searchMovies(query: string)` - Search TMDB database for movies by title
    -   `searchPeople(query: string)` - Find actors, directors, and film professionals
-   **Transport**: stdio (standard input/output)
-   **Data Sources**: TMDB API integration

#### Quotes Agent MCP Server

-   **Server Name**: `quotes-mcp-server`
-   **Available Tools**:
    -   `searchQuotes(query: string)` - Search for movie quotes by title or actor name
-   **Transport**: stdio (standard input/output)
-   **Data Sources**: Movie quotes API

### MCP Usage Examples

Start MCP servers independently for integration with other applications:

```bash
# Start Movie Agent MCP Server
npm run mcp:movie-server

# Start Quotes Agent MCP Server
npm run mcp:quotes-server
```

### MCP Integration Benefits

-   **Standardized Interface**: Consistent tool discovery and execution across different applications
-   **Secure Access**: Controlled access to agent capabilities through defined schemas
-   **Tool Composability**: Mix and match tools from different agents in external applications
-   **Protocol Compliance**: Full compatibility with MCP-enabled applications and IDEs

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
    # Rename .env_example file to .env and replace credentials
    cp .env_example .env
    # Edit .env file with your API keys:
    # TMDB_API_KEY=<your-api-key>
    # GEMINI_API_KEY=<your-api-key>
    ```

### Running the Multi-Agent System

1. Start the Movie Agent server:

    ```bash
    npm run agents:movie-agent
    ```

    The server will start on `http://localhost:41241`

2. Start the Quotes Agent server:

    ```bash
    npm run agents:quotes-agent
    ```

    The server will start on `http://localhost:41242`

3. Start the Multiagent Coordinator:

    ```bash
    npm run agents:multiagent
    ```

    The server will start on `http://localhost:41240`

4. In a separate terminal, start the CLI client:

    ```bash
       npm run a2a:cli
    ```

## 🏗 Project Structure

```
.
├── src/
│ ├── agents/
│ │ ├── movie-agent/
│ │ │ ├── index.ts                # Movie agent server implementation
│ │ │ ├── genkit.ts               # Google Genkit AI configuration
│ │ │ ├── tools.ts                # Movie & people search tools
│ │ │ ├── tmdb.ts                 # TMDB API integration
│ │ │ ├── mcp-server.ts           # MCP server for movie tools
│ │ │ ├── mcp-client.ts           # MCP client for external integration
│ │ │ ├── movie_agent.prompt      # Movie agent prompt template
│ │ ├── quotes-agent/
│ │ │ ├── index.ts                # Quotes agent server implementation
│ │ │ ├── genkit.ts               # Google Genkit AI configuration
│ │ │ ├── tools.ts                # Quote search tools
│ │ │ ├── mcp-server.ts           # MCP server for quote tools
│ │ │ ├── mcp-client.ts           # MCP client for external integration
│ │ │ ├── quotes_agent.prompt     # Quotes agent prompt template
│ │ ├── multiagent/
│ │ │ ├── index.ts                # Multiagent coordinator implementation
│ └── cli.ts                      # Command-line interface client
├── .env_example                  # Environment variables template
├── package.json                  # Node.js dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## 📱 Agent Capabilities

### Movie Agent (Port 41241)

-   **Movie Information Retrieval**: Search for movies by title with detailed information including:
    -   Plot summaries and release dates
    -   Cast and crew information
    -   Ratings and reviews
    -   Poster and backdrop images
-   **People Search**: Find information about actors, directors, and industry professionals:
    -   Biographical information
    -   Filmography and known works
    -   Profile images and career highlights

### Quotes Agent (Port 41242)

-   **Quote Search**: Specialized quote retrieval including:
    -   Quotes by movie title
    -   Quotes by actor name
    -   Themed movie quotes
    -   Properly attributed quotes with character information

### Multiagent Coordinator (Port 41240)

-   **Intelligent Routing**: Smart request distribution based on content analysis
-   **Multi-Agent Requests**: Combines responses from multiple agents
-   **Context Management**: Maintains conversation context across agent interactions

## 🔌 API Endpoints

### A2A Protocol Endpoints (All Agents)

-   `GET /.well-known/agent.json` - Agent card information
-   `POST /a2a/messages` - Send message to agent
-   `GET /a2a/messages/stream` - Streaming message interface
-   `POST /a2a/tasks/{taskId}/cancel` - Cancel active task

### Agent-Specific Endpoints

-   **Movie Agent**: `http://localhost:41241`
-   **Quotes Agent**: `http://localhost:41242`
-   **Multiagent Coordinator**: `http://localhost:41240`

### MCP Server Endpoints

-   **Movie Agent MCP Server**: stdio transport (run via `npm run mcp:movie-server`)
-   **Quotes Agent MCP Server**: stdio transport (run via `npm run mcp:quotes-server`)

#### MCP Tool Capabilities

```json
// Movie Agent MCP Tools
{
  "searchMovies": {
    "description": "Search TMDB for movies by title",
    "parameters": { "query": "string" }
  },
  "searchPeople": {
    "description": "Search TMDB for people by name",
    "parameters": { "query": "string" }
  }
}

// Quotes Agent MCP Tools
{
  "searchQuotes": {
    "description": "Search for movie quotes by title or actor",
    "parameters": { "query": "string" }
  }
}
```

## 💬 Usage Examples

### Command Line Interface

```bash
# Movie-specific queries (via Movie Agent or Multiagent)
Movie Agent > You: Tell me about Inception
Movie Agent > You: What movies has Leonardo DiCaprio been in?

# Quote-specific queries (via Quotes Agent or Multiagent)
Quotes Agent > You: Give me quotes from The Matrix
Quotes Agent > You: What are some famous quotes by Tom Hanks?

# Multi-agent queries (via Multiagent Coordinator)
Multiagent > You: Tell me about The Dark Knight and give me quotes from it
Multiagent > You: What are Christopher Nolan's best movies and famous quotes from them?

# Special commands (all agents)
Agent > You: /new      # Start new session
Agent > You: /exit     # Quit application
```

### MCP Server Usage

```bash
# Start MCP servers for external integration
npm run mcp:movie-server    # Movie tools via MCP protocol
npm run mcp:quotes-server   # Quote tools via MCP protocol

# These servers can be integrated with:
# - Claude Desktop and other MCP-compatible applications
# - Custom applications using MCP SDK
# - Development tools and IDEs with MCP support
```

### MCP Tool Integration Examples

```javascript
// Example: Using Movie MCP Client
import { MovieMCPClient } from './src/agents/movie-agent/mcp-client.js';

const client = new MovieMCPClient();
await client.connect();

// Search for movies
const movieResult = await client.searchMovies('The Dark Knight');
console.log(movieResult);

// Search for people
const peopleResult = await client.searchPeople('Christopher Nolan');
console.log(peopleResult);

client.disconnect();
```

### Request Routing Examples

-   **Movie Agent Routes**: Movie plots, actor filmographies, director information, recommendations
-   **Quotes Agent Routes**: Movie quotes by title, quotes by actor, memorable movie lines
-   **Multi-Agent Routes**: Combined movie information and quotes, comprehensive actor profiles

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
    cp .env_example .env
    # Edit .env with your API keys

    # Start all agents (in separate terminals)
    npm run agents:movie-agent
    npm run agents:quotes-agent
    npm run agents:multiagent

    # In new terminal, start CLI
    npm run a2a:cli:multiagent
    ```

3. **Try These Examples**:
    - "What are the most popular movies with Leonardo DiCaprio?"
    - "Tell me about The Dark Knight and give me quotes from it"
    - "What are Christopher Nolan's films and famous quotes from them?"
    - "Give me quotes from Star Wars"

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

Created by Oleksandr Samoilenko  
[Extrawest.com](https://extrawest.com), 2025
