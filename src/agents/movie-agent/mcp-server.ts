
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { callTmdbApi } from './tmdb.js';
import dotenv from 'dotenv';
dotenv.config();

class MovieMCPServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'movie-mcp-server',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
    }

    private setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'searchMovies',
                        description: 'Search TMDB for movies by title',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Movie title to search for',
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'searchPeople',
                        description: 'Search TMDB for people by name',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Person name to search for',
                                },
                            },
                            required: ['query'],
                        },
                    },
                ],
            };
        });

        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request) => {
                switch (request.params.name) {
                    case 'searchMovies':
                        return await this.handleSearchMovies(
                            request.params.arguments
                        );
                    case 'searchPeople':
                        return await this.handleSearchPeople(
                            request.params.arguments
                        );
                    default:
                        throw new Error(`Unknown tool: ${request.params.name}`);
                }
            }
        );
    }

    private async handleSearchMovies(args: any) {
        const { query } = args;

        if (!query || typeof query !== 'string') {
            throw new Error('Query parameter is required and must be a string');
        }

        try {
            console.error('[mcp:searchMovies]', JSON.stringify(query));
            const data = await callTmdbApi('movie', query);

            // Only modify image paths to be full URLs
            const results = data.results.map((movie: any) => {
                if (movie.poster_path) {
                    movie.poster_path = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
                }
                if (movie.backdrop_path) {
                    movie.backdrop_path = `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`;
                }
                return movie;
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                ...data,
                                results,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch (error: any) {
            console.error('[mcp:searchMovies] Error:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                error: `Failed to search movies: ${error.message}`,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    }

    private async handleSearchPeople(args: any) {
        const { query } = args;

        if (!query || typeof query !== 'string') {
            throw new Error('Query parameter is required and must be a string');
        }

        try {
            console.error('[mcp:searchPeople]', JSON.stringify(query));
            const data = await callTmdbApi('person', query);

            // Only modify image paths to be full URLs
            const results = data.results.map((person: any) => {
                if (person.profile_path) {
                    person.profile_path = `https://image.tmdb.org/t/p/w500${person.profile_path}`;
                }

                // Also modify poster paths in known_for works
                if (person.known_for && Array.isArray(person.known_for)) {
                    person.known_for = person.known_for.map((work: any) => {
                        if (work.poster_path) {
                            work.poster_path = `https://image.tmdb.org/t/p/w500${work.poster_path}`;
                        }
                        if (work.backdrop_path) {
                            work.backdrop_path = `https://image.tmdb.org/t/p/w500${work.backdrop_path}`;
                        }
                        return work;
                    });
                }

                return person;
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                ...data,
                                results,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch (error: any) {
            console.error('[mcp:searchPeople] Error:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                error: `Failed to search people: ${error.message}`,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('[MovieMCP] Server running on stdio');
    }
}

const server = new MovieMCPServer();
server.run().catch(console.error);
