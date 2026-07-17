import { Request, Response } from 'express';

// Utils
import { getAIProvider } from '../../utils/ai-provider.utils';
import { chatTools, executeTool } from '../../utils/chat-tools.utils';

// Tipos
import { ChatMessage } from '../../types/chat.types';

export const handleChat = async ( req: Request, res: Response ): Promise<void> => {
    try {
        const { messages, provider } = req.body as {
            messages: ChatMessage[];
            provider?: 'openai' | 'anthropic';
        };

        if ( !messages || !Array.isArray(messages) ) {
            res.status(400).json({ 
                error: 'Se requiere un array de mensajes' 
            });
            return;
        }

        // Extrae todas las imágenes de los mensajes del usuario, en orden, para poder resolver "imagenIndex" cuando el modelo pida crear_variante_con_imagen
        const images = messages
            .filter( m => m.role === 'user' && Array.isArray(m.content) )
            .flatMap( m => (m.content as any[])
                .filter( b => b.type === 'image' )
                .map( b => b.imageBase64 )
            );

        const aiProvider = getAIProvider(provider ?? 'openai');
        const conversationHistory = [...messages];
        let finalContent: string | null = null;

        for ( let i = 0; i < 5; i++ ) {
            const response = await aiProvider.send(conversationHistory, chatTools);

            console.log(`\n--- Chat ${i + 1} ---`);
            console.log('Contenido de texto:', response.content);
            console.log('Tools pedidas:', JSON.stringify(response.toolCalls, null, 2));

            if ( response.toolCalls.length === 0 ) {
                finalContent = response.content;
                break;
            }

            conversationHistory.push({
                role: 'assistant',
                content: response.content ?? '',
                tool_calls: response.toolCalls
            });

            for ( const call of response.toolCalls ) {
                let result: any;
                try {
                    result = await executeTool(call.name, call.arguments, images);
                } catch ( error: any ) {
                    result = { error: error.message };
                }

                console.log(`Resultado de "${call.name}":`, JSON.stringify(result, null, 2));

                conversationHistory.push({
                    role: 'tool',
                    content: JSON.stringify(result),
                    tool_call_id: call.id
                });
            }
        }

        res.json({ 
            role: 'assistant', 
            content: finalContent ?? 'No pude generar una respuesta.' 
        });

    } catch ( error: any ) {
        console.error('Error en /chat:', error);
        res.status(500).json({ 
            error: 'Error al procesar la solicitud de chat' 
        });
    }
};