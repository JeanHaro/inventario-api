import Anthropic from '@anthropic-ai/sdk';

// Utils
import { AIProvider, AIProviderResponse } from '../ai-provider.utils';

// Tipos
import { ChatMessage, ToolDefinition } from '../../types/chat.types';

export class AnthropicProvider implements AIProvider {
    private client = new Anthropic({ 
        apiKey: process.env.ANTHROPIC_API_KEY 
    });

    async send ( 
        messages: ChatMessage[], 
        tools: ToolDefinition[] 
    ): Promise<AIProviderResponse> {
        const anthropicMessages = this.transformMessages(messages);

        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 1024,
            messages: anthropicMessages,
            tools: tools.map( t => ({
                name: t.name,
                description: t.description,
                input_schema: t.parameters
            }) ),
        });

        const textBlock = response.content.find( b => b.type === 'text' );
        const toolBlocks = response.content.filter( b => b.type === 'tool_use' );

        return {
            content: textBlock && textBlock.type === 'text' ? textBlock.text : null,
            toolCalls: toolBlocks.map( b => b.type === 'tool_use' ? {
                id: b.id, name: b.name, arguments: b.input as Record<string, any>
            } : null ).filter(Boolean) as any
        };
    }

    private transformMessages ( messages: ChatMessage[] ): Anthropic.MessageParam[] {
        const result: Anthropic.MessageParam[] = [];

        for ( const m of messages ) {
            if ( 
                m.role === 'assistant' && 
                m.tool_calls && m.tool_calls.length > 0 
            ) {
                const content: Anthropic.ContentBlockParam[] = [];

                if ( m.content && typeof m.content === 'string' ) content.push({ type: 'text', text: m.content });

                for ( const tc of m.tool_calls ) {
                    content.push({ 
                        type: 'tool_use', 
                        id: tc.id, 
                        name: tc.name, 
                        input: tc.arguments 
                    });
                }

                result.push({ role: 'assistant', content });
                continue;
            }

            if ( m.role === 'tool' ) {
                result.push({
                    role: 'user',
                    content: [{ 
                        type: 'tool_result', 
                        tool_use_id: m.tool_call_id!, 
                        content: m.content as string ?? '' 
                    }]
                });
                continue;
            }

            // Usuario con contenido multimodal
            if ( Array.isArray(m.content) ) {
                const blocks: Anthropic.ContentBlockParam[] = m.content.map( 
                    block => {
                        if ( block.type === 'text' ) return { 
                            type: 'text', 
                            text: block.text! 
                        };

                        const [ header, data ] = block.imageBase64!.split(',');
                        const mimeMatch = header.match(/data:(.*);base64/);
                        const mediaType = (mimeMatch ? mimeMatch[1] : 'image/jpeg') as any;

                        return { 
                            type: 'image', 
                            source: { 
                                type: 'base64', 
                                media_type: mediaType, 
                                data 
                            } 
                        };
                    }
                );

                result.push({ 
                    role: 'user', 
                    content: blocks 
                });

                continue;
            }

            result.push({
                role: m.role as 'user' | 'assistant', 
                content: (m.content as string) ?? '' 
            });
        }

        return result;
    }
}