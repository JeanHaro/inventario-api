// Tipos
import { 
    ChatMessage, 
    ToolCall,
    ToolDefinition 
} from '../types/chat.types';

export interface AIProviderResponse {
    content: string | null;
    toolCalls: ToolCall[];
}

export interface AIProvider {
    send ( 
        messages: ChatMessage[], 
        tools: ToolDefinition[] 
    ): Promise<AIProviderResponse>;
}

export function getAIProvider ( provider: string ): AIProvider {
    if ( provider === 'anthropic' ) {
        const { AnthropicProvider } = require('./providers/anthropic.provider');
        return new AnthropicProvider();
    }

    const { OpenAIProvider } = require('./providers/openai.provider');
    return new OpenAIProvider();
}