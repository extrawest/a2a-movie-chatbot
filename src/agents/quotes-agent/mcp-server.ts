
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
dotenv.config();

class QuotesMCPServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'quotes-mcp-server',
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
                        name: 'searchQuotes',
                        description:
                            'Search for movie quotes related to a movie title or actor name',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description:
                                        'Movie title or actor name to search for quotes',
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
                    case 'searchQuotes':
                        return await this.handleSearchQuotes(
                            request.params.arguments
                        );
                    default:
                        throw new Error(`Unknown tool: ${request.params.name}`);
                }
            }
        );
    }

    private async handleSearchQuotes(args: any) {
        const { query } = args;

        if (!query || typeof query !== 'string') {
            throw new Error('Query parameter is required and must be a string');
        }

        try {
            console.error('[mcp:searchQuotes]', JSON.stringify(query));

            // First try to get all quotes and filter them
            const apiUrl = 'https://quoteapi.pythonanywhere.com/quotes/';

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Filter quotes that might be related to the query
            let relevantQuotes = [];

            // The API returns { "Quotes": [[array of quote objects]] }
            if (
                data.Quotes &&
                Array.isArray(data.Quotes) &&
                data.Quotes.length > 0 &&
                Array.isArray(data.Quotes[0])
            ) {
                const allQuotes = data.Quotes[0]; // Extract the actual quotes array
                relevantQuotes = allQuotes.filter((quote: any) => {
                    const searchTerm = query.toLowerCase();
                    return (
                        (quote.movie_title &&
                            quote.movie_title
                                .toLowerCase()
                                .includes(searchTerm)) ||
                        (quote.actor_name &&
                            quote.actor_name
                                .toLowerCase()
                                .includes(searchTerm)) ||
                        (quote.author &&
                            quote.author.toLowerCase().includes(searchTerm))
                    );
                });
            }

            // If no specific matches found, try to get some random quotes as fallback
            if (relevantQuotes.length === 0) {
                console.error(
                    '[mcp:searchQuotes] No specific matches found, trying random endpoint'
                );
                const randomResponse = await fetch(
                    'https://quoteapi.pythonanywhere.com/random'
                );
                if (randomResponse.ok) {
                    const randomData = await randomResponse.json();
                    if (
                        randomData.Quotes &&
                        Array.isArray(randomData.Quotes) &&
                        randomData.Quotes.length > 0 &&
                        Array.isArray(randomData.Quotes[0])
                    ) {
                        relevantQuotes = randomData.Quotes[0].slice(0, 3);
                    }
                }
            }

            const result = {
                query: query,
                quotes: relevantQuotes.slice(0, 5), // Limit to 5 quotes max
                total_found: relevantQuotes.length,
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (error: any) {
            console.error('[mcp:searchQuotes] Error:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                query: query,
                                quotes: [],
                                total_found: 0,
                                error: `Failed to fetch quotes: ${error.message}`,
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
        console.error('[QuotesMCP] Server running on stdio');
    }
}

const server = new QuotesMCPServer();
server.run().catch(console.error);
