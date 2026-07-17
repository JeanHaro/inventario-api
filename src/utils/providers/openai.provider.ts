import OpenAI from 'openai';

// Utils
import { AIProvider, AIProviderResponse } from '../ai-provider.utils';

// Tipos
import { ChatMessage, ToolDefinition } from '../../types/chat.types';

export class OpenAIProvider implements AIProvider {
    private client = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
    });

    async send ( messages: ChatMessage[], tools: ToolDefinition[] ): Promise<AIProviderResponse> {
        const openaiMessages = messages.map( m => {
            if ( m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0 ) {
                return {
                    role: 'assistant',
                    content: m.content,
                    tool_calls: m.tool_calls.map( tc => ({
                        id: tc.id,
                        type: 'function',
                        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
                    }) )
                };
            }

            if ( m.role === 'tool' ) {
                return { 
                    role: 'tool', 
                    content: m.content, 
                    tool_call_id: m.tool_call_id 
                };
            }

            // Usuario con contenido multimodal (texto + imágenes)
            if ( Array.isArray(m.content) ) {
                return {
                    role: 'user',
                    content: m.content.map( block =>
                        block.type === 'text'
                            ? { type: 'text', text: block.text }
                            : { type: 'image_url', image_url: { url: block.imageBase64 } }
                    )
                };
            }

            return { 
                role: m.role, 
                content: m.content 
            };
        });

        const response = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: openaiMessages as any,
            tools: tools.map( t => ({
                type: 'function',
                function: { 
                    name: t.name, 
                    description: t.description, 
                    parameters: t.parameters 
                }
            }) ),
        });

        const choice = response.choices[0].message;

        return {
            content: choice.content,
            toolCalls: (choice.tool_calls ?? [])
                .filter( ( tc ): tc is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall =>
                    tc.type === 'function'
                )
                .map( tc => ({
                        id: tc.id,
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments)
                    }) 
                )
        };
    }
}