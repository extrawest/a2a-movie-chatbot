import { ai, z } from './genkit.js';

export const searchQuotes = ai.defineTool(
    {
        name: 'searchQuotes',
        description:
            'search for movie quotes related to a movie title or actor name',
        inputSchema: z.object({
            query: z
                .string()
                .describe('Movie title or actor name to search for quotes'),
        }),
    },
    async ({ query }) => {
        console.log('[quotes:searchQuotes]', JSON.stringify(query));
        try {
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
                console.log(
                    '[quotes:searchQuotes] No specific matches found, trying random endpoint'
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

            return {
                query: query,
                quotes: relevantQuotes.slice(0, 5), // Limit to 5 quotes max
                total_found: relevantQuotes.length,
            };
        } catch (error) {
            console.error('Error searching quotes:', error);
            // Return empty results instead of throwing to avoid breaking the movie search
            return {
                query: query,
                quotes: [],
                total_found: 0,
                error: `Failed to fetch quotes: ${error.message}`,
            };
        }
    }
);
