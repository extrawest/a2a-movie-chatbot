import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class QuotesMCPClient {
    private client: Client;
    private transport: StdioClientTransport | null = null;

    constructor() {
        this.client = new Client(
            {
                name: 'quotes-agent-client',
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
            args: ['tsx', 'src/agents/quotes-agent/mcp-server.ts'],
        });

        await this.client.connect(this.transport);
        console.error('[QuotesMCPClient] Connected to MCP server');
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

    async searchQuotes(query: string) {
        return await this.callTool('searchQuotes', { query });
    }

    disconnect() {
        if (this.transport) {
            this.transport.close();
            this.transport = null;
        }
    }
}
