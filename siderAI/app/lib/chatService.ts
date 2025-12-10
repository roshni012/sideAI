import { API_ENDPOINTS } from './apiConfig';
import { fetchWithAuth } from './fetchUtils';

// Interfaces
export interface ConversationResponse {
    id: string;
    title: string;
    model?: string;
    created_at?: string;
}

export interface ImageGenerationPayload {
    prompt: string;
    model: string;
    width: number;
    height: number;
    num_outputs: number;
    guidance_scale: number;
    num_inference_steps: number;
    conversation_id: string;
}

export interface ImageItem {
    prompt: string;
    image_urls: string[];
    conversation_id: string;
    created_at: string;
    title?: string;
}

export interface ConversationHistoryItem {
    conversation_id: string;
    title?: string;
    prompt: string;
    first_image: string | null;
    created_at: string;
    total_images: number;
}

// Create a new conversation
export async function createConversation(
    title: string = 'Image Generation',
    model: string
): Promise<string | null> {
    try {
        const response = await fetchWithAuth(API_ENDPOINTS.CONVERSATIONS.CREATE, {
            method: 'POST',
            body: JSON.stringify({
                title,
                model,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.detail || 'Failed to create conversation');
        }

        const newConversationId = data?.data?.id || data?.id;
        if (newConversationId) {
            console.log('Created new conversation:', newConversationId);
            return newConversationId;
        }

        return null;
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }
}

// Update conversation title
export async function updateConversation(
    conversationId: string,
    title: string
): Promise<boolean> {
    try {
        const response = await fetchWithAuth(`/api/conversations/${conversationId}`, {
            method: 'PUT',
            body: JSON.stringify({
                title,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.detail || 'Failed to update conversation');
        }

        return true;
    } catch (error) {
        console.error('Error updating conversation:', error);
        throw error;
    }
}

// Delete conversation
export async function deleteConversation(conversationId: string): Promise<boolean> {
    try {
        const response = await fetchWithAuth(`/api/conversations/${conversationId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.detail || 'Failed to delete conversation');
        }

        return true;
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
    }
}

// Generate images
export async function generateImages(
    payload: ImageGenerationPayload
): Promise<any> {
    try {
        const response = await fetchWithAuth(API_ENDPOINTS.IMAGES.GENERATE, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const detail = data?.detail || data?.msg || 'Failed to generate image';
            throw new Error(
                Array.isArray(detail)
                    ? detail.map((item: { msg?: string; message?: string }) => item?.msg || item?.message).join(', ')
                    : detail
            );
        }

        return data;
    } catch (error) {
        console.error('Error generating images:', error);
        throw error;
    }
}

// Fetch all images from a conversation
export async function fetchConversationImages(
    conversationId: string
): Promise<ImageItem[]> {
    try {
        const response = await fetchWithAuth(`/api/images/conversation/${conversationId}`);

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.detail || 'Failed to load conversation images');
        }

        return data?.data || [];
    } catch (error) {
        console.error('Error fetching conversation images:', error);
        throw error;
    }
}

// Fetch image generation history
export async function fetchImageHistory(): Promise<ConversationHistoryItem[]> {
    try {
        const response = await fetchWithAuth(API_ENDPOINTS.IMAGES.HISTORY);

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.detail || 'Failed to load history');
        }

        // Group images by conversation_id
        const images: ImageItem[] = data?.data || [];
        const conversationsMap = new Map<string, ConversationHistoryItem>();

        images.forEach((item) => {
            const convId = item.conversation_id;
            if (!conversationsMap.has(convId)) {
                conversationsMap.set(convId, {
                    conversation_id: convId,
                    title: item.title,
                    prompt: item.prompt,
                    first_image: item.image_urls?.[0] || null,
                    created_at: item.created_at,
                    total_images: item.image_urls?.length || 0,
                });
            }
        });

        // Convert map to array and sort by created_at (newest first)
        const conversations = Array.from(conversationsMap.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return conversations;
    } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
    }
}

// Optimize prompt
export async function optimizePrompt(prompt: string): Promise<string> {
    try {
        const response = await fetchWithAuth(API_ENDPOINTS.IMAGES.OPTIMIZE_PROMPT, {
            method: 'POST',
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const detail = data?.detail || data?.msg || 'Failed to optimize prompt';
            throw new Error(
                Array.isArray(detail)
                    ? detail.map((item: { msg?: string; message?: string }) => item?.msg || item?.message).join(', ')
                    : detail
            );
        }

        const optimized = data?.data?.optimized_prompt || data?.data?.prompt || data?.optimized_prompt || data?.prompt || '';
        return optimized;
    } catch (error) {
        console.error('Error optimizing prompt:', error);
        throw error;
    }
}

// Helper function to extract all image URLs from conversation
export function extractAllImageUrls(images: ImageItem[]): string[] {
    const allImageUrls: string[] = [];

    images.forEach((item) => {
        if (item.image_urls && Array.isArray(item.image_urls)) {
            allImageUrls.push(...item.image_urls);
        }
    });

    return allImageUrls;
}

// Helper function to get conversation prompt
export function getConversationPrompt(images: ImageItem[]): string {
    for (const item of images) {
        if (item.prompt) {
            return item.prompt;
        }
    }
    return '';
}
