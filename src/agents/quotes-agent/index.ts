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
import { MessageData } from 'genkit';
import { ai } from './genkit.js';
import { searchQuotes } from './tools.js';

// Simple store for contexts
const contexts: Map<string, Message[]> = new Map();

// Load the Genkit prompt
const quotesAgentPrompt = ai.prompt('quotes_agent');

/**
 * QuotesAgentExecutor implements the agent's core logic.
 */
class QuotesAgentExecutor implements AgentExecutor {
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
            `[QuotesAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`
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
                            text: 'Searching for quotes, hang tight!',
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

        const messages: MessageData[] = historyForGenkit
            .map((m) => ({
                role: (m.role === 'agent' ? 'model' : 'user') as
                    | 'user'
                    | 'model',
                content: m.parts
                    .filter(
                        (p): p is TextPart =>
                            p.kind === 'text' && !!(p as TextPart).text
                    )
                    .map((p) => ({
                        text: (p as TextPart).text,
                    })),
            }))
            .filter((m) => m.content.length > 0);

        if (messages.length === 0) {
            console.warn(
                `[QuotesAgentExecutor] No valid text messages found in history for task ${taskId}.`
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

        const goal =
            (existingTask?.metadata?.goal as string | undefined) ||
            (userMessage.metadata?.goal as string | undefined);

        try {
            // Run the Genkit prompt
            const response = await quotesAgentPrompt(
                { goal: goal, now: new Date().toISOString() },
                {
                    messages,
                    tools: [searchQuotes],
                }
            );

            // Check if the request has been cancelled
            if (this.cancelledTasks.has(taskId)) {
                console.log(
                    `[QuotesAgentExecutor] Request cancelled for task: ${taskId}`
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

            const responseText = response.text;
            console.info(
                `[QuotesAgentExecutor] Prompt response: ${responseText}`
            );
            const lines = responseText.trim().split('\n');
            const finalStateLine = lines.at(-1)?.trim().toUpperCase();
            const agentReplyText = lines
                .slice(0, lines.length - 1)
                .join('\n')
                .trim();

            let finalA2AState: TaskState = 'unknown';

            if (finalStateLine === 'COMPLETED') {
                finalA2AState = 'completed';
            } else if (finalStateLine === 'AWAITING_USER_INPUT') {
                finalA2AState = 'input-required';
            } else {
                console.warn(
                    `[QuotesAgentExecutor] Unexpected final state line from prompt: ${finalStateLine}. Defaulting to 'completed'.`
                );
                finalA2AState = 'completed';
            }

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
                `[QuotesAgentExecutor] Task ${taskId} finished with state: ${finalA2AState}`
            );
        } catch (error: any) {
            console.error(
                `[QuotesAgentExecutor] Error processing task ${taskId}:`,
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

const quotesAgentCard: AgentCard = {
    name: 'Quotes Agent',
    description:
        'An agent that specializes in finding memorable quotes from movies and TV shows.',
    url: 'http://localhost:41242/',
    provider: {
        organization: 'Local Development',
        url: 'http://localhost:41242',
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
            id: 'movie_quotes_search',
            name: 'Movie Quotes Search',
            description:
                'Find memorable quotes from movies and TV shows by title, actor, or theme.',
            tags: ['quotes', 'movies', 'cinema'],
            examples: [
                'Give me quotes from The Godfather',
                'What are some famous quotes by Tom Hanks?',
                'Find quotes from Star Wars movies',
                'Show me memorable quotes from Casablanca',
                'What are some iconic movie quotes?',
            ],
            inputModes: ['text'],
            outputModes: ['text', 'task-status'],
        },
    ],
    supportsAuthenticatedExtendedCard: false,
};

async function main() {
    const taskStore: TaskStore = new InMemoryTaskStore();
    const agentExecutor: AgentExecutor = new QuotesAgentExecutor();
    const requestHandler = new DefaultRequestHandler(
        quotesAgentCard,
        taskStore,
        agentExecutor
    );

    const appBuilder = new A2AExpressApp(requestHandler);
    const expressApp = appBuilder.setupRoutes(express() as any);

    const PORT = process.env.PORT || 41242;
    expressApp.listen(PORT, () => {
        console.log(`[QuotesAgent] Server started on http://localhost:${PORT}`);
        console.log(
            `[QuotesAgent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`
        );
        console.log('[QuotesAgent] Press Ctrl+C to stop the server');
    });
}

main().catch(console.error);
