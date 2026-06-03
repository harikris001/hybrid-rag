export interface DocumentSource {
    source: string;
    chunk_number?: number;
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
