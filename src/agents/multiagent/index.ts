import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import {
    AgentCard,
    Task,
    TaskState,
    TaskStatusUpdateEvent,
    TextPart,
    Message,
} from '@a2a-js/sdk';
import {
    InMemoryTaskStore,
    TaskStore,
    A2AExpressApp,
    AgentExecutor,
    RequestContext,
    ExecutionEventBus,
    DefaultRequestHandler,
} from '@a2a-js/sdk/server';
import { A2AClient } from '@a2a-js/sdk/client';

const MOVIE_AGENT_URL = 'http://localhost:41241';
const QUOTES_AGENT_URL = 'http://localhost:41242';

// Simple store for contexts
const contexts: Map<string, Message[]> = new Map();

// Agent communication helper
async function callAgent(url: string, message: string): Promise<string> {
    try {
        const client = new A2AClient(url);
        // const agentCard = await client.getAgentCard();

        const messageId = uuidv4();
        const contextId = uuidv4();

        const params = {
            message: {
                messageId,
                kind: 'message' as const,
                role: 'user' as const,
                parts: [
                    {
                        kind: 'text' as const,
                        text: message,
                    },
                ],
                contextId,
            },
        };

        const stream = client.sendMessageStream(params);
        let finalResponse = '';

        for await (const event of stream) {
            if (
                event.kind === 'status-update' &&
                event.status.message &&
                event.final
            ) {
                const message = event.status.message;
                const textParts = message.parts.filter(
                    (part: any) => part.kind === 'text'
                );
                if (textParts.length > 0) {
                    finalResponse = textParts
                        .map((part: any) => part.text)
                        .join('\n');
                }
                break;
            }
        }

        return finalResponse || 'No response received';
    } catch (error: any) {
        console.error(`Error calling agent at ${url}:`, error);
        return `Error: Failed to contact agent - ${error.message}`;
    }
}

// Request analysis helper
function analyzeRequest(text: string): 'movie' | 'quotes' | 'both' {
    const lowerText = text.toLowerCase();

    const quoteKeywords = [
        'quote',
        'quotes',
        'say',
        'said',
        'line',
        'lines',
        'memorable',
        'famous quotes',
    ];
    const movieKeywords = [
        'movie',
        'film',
        'plot',
        'actor',
        'director',
        'cast',
        'about',
        'tell me about',
    ];
    const bothKeywords = [
        'and quote',
        'and quotes',
        'with quotes',
        'plus quotes',
    ];

    const hasQuoteKeywords = quoteKeywords.some((keyword) =>
        lowerText.includes(keyword)
    );
    const hasMovieKeywords = movieKeywords.some((keyword) =>
        lowerText.includes(keyword)
    );
    const hasBothKeywords = bothKeywords.some((keyword) =>
        lowerText.includes(keyword)
    );

    if (hasBothKeywords || (hasQuoteKeywords && hasMovieKeywords)) {
        return 'both';
    } else if (hasQuoteKeywords) {
        return 'quotes';
    } else {
        return 'movie';
    }
}

/**
 * MultiagentExecutor implements the multiagent coordinator logic.
 */
class MultiagentExecutor implements AgentExecutor {
    private cancelledTasks = new Set<string>();

    public cancelTask = async (
        taskId: string,
        eventBus: ExecutionEventBus
    ): Promise<void> => {
        this.cancelledTasks.add(taskId);
    };

    async execute(
        requestContext: RequestContext,
        eventBus: ExecutionEventBus
    ): Promise<void> {
        const userMessage = requestContext.userMessage;
        const existingTask = requestContext.task;

        const taskId = existingTask?.id || uuidv4();
        const contextId =
            userMessage.contextId || existingTask?.contextId || uuidv4();

        console.log(
            `[MultiagentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`
        );

        // Publish initial Task event if it's a new task
        if (!existingTask) {
            const initialTask: Task = {
                kind: 'task',
                id: taskId,
                contextId: contextId,
                status: {
                    state: 'submitted',
                    timestamp: new Date().toISOString(),
                },
                history: [userMessage],
                metadata: userMessage.metadata,
            };
            eventBus.publish(initialTask);
        }

        // Publish "working" status update
        const workingStatusUpdate: TaskStatusUpdateEvent = {
            kind: 'status-update',
            taskId: taskId,
            contextId: contextId,
            status: {
                state: 'working',
                message: {
                    kind: 'message',
                    role: 'agent',
                    messageId: uuidv4(),
                    parts: [
                        {
                            kind: 'text',
                            text: 'Routing your request to the appropriate agents...',
                        },
                    ],
                    taskId: taskId,
                    contextId: contextId,
                },
                timestamp: new Date().toISOString(),
            },
            final: false,
        };
        eventBus.publish(workingStatusUpdate);

        // Prepare messages for Genkit prompt
        const historyForGenkit = contexts.get(contextId) || [];
        if (
            !historyForGenkit.find((m) => m.messageId === userMessage.messageId)
        ) {
            historyForGenkit.push(userMessage);
        }
        contexts.set(contextId, historyForGenkit);

        // Extract the user's current message text
        const userText = userMessage.parts
            .filter(
                (p): p is TextPart =>
                    p.kind === 'text' && !!(p as TextPart).text
            )
            .map((p) => (p as TextPart).text)
            .join(' ');

        if (!userText.trim()) {
            console.warn(
                `[MultiagentExecutor] No valid text content found in message for task ${taskId}.`
            );
            const failureUpdate: TaskStatusUpdateEvent = {
                kind: 'status-update',
                taskId: taskId,
                contextId: contextId,
                status: {
                    state: 'failed',
                    message: {
                        kind: 'message',
                        role: 'agent',
                        messageId: uuidv4(),
                        parts: [
                            {
                                kind: 'text',
                                text: 'No message found to process.',
                            },
                        ],
                        taskId: taskId,
                        contextId: contextId,
                    },
                    timestamp: new Date().toISOString(),
                },
                final: true,
            };
            eventBus.publish(failureUpdate);
            return;
        }

        try {
            // Analyze the request to determine routing
            const requestType = analyzeRequest(userText);
            console.log(`[MultiagentExecutor] Request type: ${requestType}`);

            let agentReplyText = '';

            if (requestType === 'movie') {
                // Route to Movie Agent
                console.log(`[MultiagentExecutor] Routing to Movie Agent`);
                agentReplyText = await callAgent(MOVIE_AGENT_URL, userText);
            } else if (requestType === 'quotes') {
                // Route to Quotes Agent
                console.log(`[MultiagentExecutor] Routing to Quotes Agent`);
                agentReplyText = await callAgent(QUOTES_AGENT_URL, userText);
            } else {
                // Route to both agents
                console.log(`[MultiagentExecutor] Routing to both agents`);
                const movieResponse = await callAgent(
                    MOVIE_AGENT_URL,
                    userText
                );
                const quotesResponse = await callAgent(
                    QUOTES_AGENT_URL,
                    userText
                );

                agentReplyText = `**Movie Information:**\n${movieResponse}\n\n**Quotes:**\n${quotesResponse}`;
            }

            // Check if the request has been cancelled
            if (this.cancelledTasks.has(taskId)) {
                console.log(
                    `[MultiagentExecutor] Request cancelled for task: ${taskId}`
                );

                const cancelledUpdate: TaskStatusUpdateEvent = {
                    kind: 'status-update',
                    taskId: taskId,
                    contextId: contextId,
                    status: {
                        state: 'canceled',
                        timestamp: new Date().toISOString(),
                    },
                    final: true,
                };
                eventBus.publish(cancelledUpdate);
                return;
            }

            console.info(
                `[MultiagentExecutor] Agent response: ${agentReplyText.substring(
                    0,
                    100
                )}...`
            );

            // Always mark as completed since we handled the request
            const finalA2AState: TaskState = 'completed';

            // Publish final task status update
            const agentMessage: Message = {
                kind: 'message',
                role: 'agent',
                messageId: uuidv4(),
                parts: [{ kind: 'text', text: agentReplyText || 'Completed.' }],
                taskId: taskId,
                contextId: contextId,
            };
            historyForGenkit.push(agentMessage);
            contexts.set(contextId, historyForGenkit);

            const finalUpdate: TaskStatusUpdateEvent = {
                kind: 'status-update',
                taskId: taskId,
                contextId: contextId,
                status: {
                    state: finalA2AState,
                    message: agentMessage,
                    timestamp: new Date().toISOString(),
                },
                final: true,
            };
            eventBus.publish(finalUpdate);

            console.log(
                `[MultiagentExecutor] Task ${taskId} finished with state: ${finalA2AState}`
            );
        } catch (error: any) {
            console.error(
                `[MultiagentExecutor] Error processing task ${taskId}:`,
                error
            );
            const errorUpdate: TaskStatusUpdateEvent = {
                kind: 'status-update',
                taskId: taskId,
                contextId: contextId,
                status: {
                    state: 'failed',
                    message: {
                        kind: 'message',
                        role: 'agent',
                        messageId: uuidv4(),
                        parts: [
                            {
                                kind: 'text',
                                text: `Agent error: ${error.message}`,
                            },
                        ],
                        taskId: taskId,
                        contextId: contextId,
                    },
                    timestamp: new Date().toISOString(),
                },
                final: true,
            };
            eventBus.publish(errorUpdate);
        }
    }
}

const multiagentCard: AgentCard = {
    name: 'Movie & Quotes Multiagent',
    description:
        'A multiagent coordinator that routes requests between specialized movie and quotes agents.',
    url: 'http://localhost:41240/',
    provider: {
        organization: 'Local Development',
        url: 'http://localhost:41240',
    },
    version: '0.0.1',
    capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true,
    },
    securitySchemes: undefined,
    security: undefined,
    defaultInputModes: ['text'],
    defaultOutputModes: ['text', 'task-status'],
    skills: [
        {
            id: 'movie_and_quotes_coordination',
            name: 'Movie & Quotes Coordination',
            description:
                'Coordinate between movie information and quotes agents to provide comprehensive responses.',
            tags: ['movies', 'quotes', 'coordination', 'multiagent'],
            examples: [
                'Tell me about The Godfather and give me some quotes',
                'What movies has Tom Hanks been in?',
                'Give me quotes from Casablanca',
                'Tell me about Christopher Nolan and quotes from his movies',
                'What are the best sci-fi movies and their memorable quotes?',
            ],
            inputModes: ['text'],
            outputModes: ['text', 'task-status'],
        },
    ],
    supportsAuthenticatedExtendedCard: false,
};

async function main() {
    const taskStore: TaskStore = new InMemoryTaskStore();
    const agentExecutor: AgentExecutor = new MultiagentExecutor();
    const requestHandler = new DefaultRequestHandler(
        multiagentCard,
        taskStore,
        agentExecutor
    );

    const appBuilder = new A2AExpressApp(requestHandler);
    const expressApp = appBuilder.setupRoutes(express() as any);

    const PORT = process.env.PORT || 41240;
    expressApp.listen(PORT, () => {
        console.log(`[Multiagent] Server started on http://localhost:${PORT}`);
        console.log(
            `[Multiagent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`
        );
        console.log('[Multiagent] Press Ctrl+C to stop the server');
    });
}

main().catch(console.error);
