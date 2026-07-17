export type ChatContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; imageBase64: string };

export interface ChatMessage {
    role: 'user' | 'assistant' | 'tool';
    content: string | ChatContentBlock[] | null;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
}