import { API_ENDPOINTS, getApiUrl } from '../lib/apiConfig';

/**
 * Get the authorization token from localStorage
 */
const getAuthToken = (): string => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        return token ? `Bearer ${token}` : '';
    }
    return '';
};

export interface Note {
    id: string;
    title: string;
    content: string;
    updated_at: string;
}

export interface NotesListResponse {
    code: number;
    data: Note[];
    message?: string;
}

export interface NoteCreatePayload {
    title: string;
    content: string;
    wisebase_id: string;
    metadata?: {
        source?: string;
        tags?: string[];
    };
}

export interface NoteCreateResponse {
    code: number;
    data?: {
        note_id: string;
    };
    message?: string;
}

export interface NoteDeleteResponse {
    code: number;
    message?: string;
}

/**
 * Fetch all notes for a specific wisebase
 */
export const fetchNotes = async (wisebaseId: string = 'inbox'): Promise<Note[]> => {
    try {
        const url = `${getApiUrl(API_ENDPOINTS.NOTES.LIST)}?limit=100&offset=0`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getAuthToken(),
                'Content-Type': 'application/json',
            },
        });

        const data: NotesListResponse = await response.json();

        if (data.code === 0 && Array.isArray(data.data)) {
            return data.data;
        }

        return [];
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        return [];
    }
};

/**
 * Create a new note
 */
export const createNote = async (payload: NoteCreatePayload): Promise<NoteCreateResponse> => {
    try {
        const url = getApiUrl(API_ENDPOINTS.NOTES.CREATE);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': getAuthToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data: NoteCreateResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to create note:', error);
        return {
            code: -1,
            message: 'Failed to create note',
        };
    }
};

/**
 * Delete a note by ID
 */
export const deleteNote = async (noteId: string): Promise<NoteDeleteResponse> => {
    try {
        const url = `${getApiUrl(API_ENDPOINTS.NOTES.DELETE)}/${noteId}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': getAuthToken(),
                'Content-Type': 'application/json',
            },
        });

        const data: NoteDeleteResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to delete note:', error);
        return {
            code: -1,
            message: 'Failed to delete note',
        };
    }
};
