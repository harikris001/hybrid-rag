export interface DocumentSource {
    id?: string;
    source: string;
    chunk_number?: number;
    text?: string;
    document?: string;
    [key: string]: unknown; // Allow for other ChromaDB metadata fields
}

export interface MessageMetadata {
    sources: DocumentSource[];
}

export interface Message {
    id: string;
    content: string;
    role: string; // "user" | "assistant"
    timestamp: string;
    conversation_id: string;
    metadata?: MessageMetadata;
}

export interface Conversation {
    id: string;
    title: string;
    created_at: string;
}

export interface ConversationDetail extends Conversation {
    messages: Message[];
}

export interface ChatResponse {
    response: string;
}

export interface DocumentListResponse {
    files: string[];
}

export interface UploadResponse {
    filename: string;
    saved_to: string;
    message: string;
}

export interface ChatPageProps {
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    onSend: (prompt: string) => void;
    onStopStreaming: () => void;
    activeTool: { tool: string; query?: string } | null;
}

export interface NavItemProps {
    icon: string;
    label: string;
    to?: string;
    active?: boolean;
    textSize?: string;
    onClick?: () => void;
}

export interface UserProfile {
    interests: string[];
    preferences: string[];
    updated_at: string | null;
}

export interface MemoryUpdateEvent {
    interests: string[];
    preferences: string[];
    new_interests: string[];
    new_preferences: string[];
}


export interface MemoryToastProps {
    event: MemoryUpdateEvent | null;
    onDismiss: () => void;
}
