import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MovieMCPClient {
    private client: Client;
    private transport: StdioClientTransport | null = null;

    constructor() {
        this.client = new Client(
            {
                name: 'movie-agent-client',
                version: '0.1.0',
            },
            {
                capabilities: {},
            }
        );
    }

    async connect() {
        this.transport = new StdioClientTransport({
            command: 'npx',
            args: ['tsx', 'src/agents/movie-agent/mcp-server.ts'],
        });

        await this.client.connect(this.transport);
        console.error('[MovieMCPClient] Connected to MCP server');
    }

    async listTools() {
        return await this.client.listTools();
    }

    async callTool(name: string, args: any) {
        return await this.client.callTool({
            name,
            arguments: args,
        });
    }

    async searchMovies(query: string) {
        console.log('searchMovies>>>>', query);
        return await this.callTool('searchMovies', { query });
    }

    async searchPeople(query: string) {
        console.log('searchPeople>>>>', query);

        return await this.callTool('searchPeople', { query });
    }

    disconnect() {
        if (this.transport) {
            this.transport.close();
            this.transport = null;
        }
    }
}
