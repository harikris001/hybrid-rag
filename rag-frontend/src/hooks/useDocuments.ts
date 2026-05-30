import { useCallback, useState } from "react";
import { fetchDocuments, uploadDocument } from "../services/api";

/**
 * useDocuments – manages document listing and uploads.
 *
 * Provides the file list for the library modal and handles
 * uploading new documents to the backend for RAG ingestion.
 */
export function useDocuments() {
    const [files, setFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    // ── Load the list of uploaded documents ──────────────────
    const loadDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchDocuments();
            setFiles(data.files);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load documents");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Upload a file and refresh the list ──────────────────
    const upload = useCallback(async (file: File) => {
        setIsUploading(true);
        setError(null);
        setUploadStatus(null);

        try {
            const result = await uploadDocument(file);
            setUploadStatus(result.message);
            // Refresh the file list after successful upload
            await loadDocuments();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
        }
    }, [loadDocuments]);

    // ── Clear status messages ───────────────────────────────
    const clearStatus = useCallback(() => {
        setUploadStatus(null);
        setError(null);
    }, []);

    return {
        files,
        isLoading,
        isUploading,
        error,
        uploadStatus,
        loadDocuments,
        upload,
        clearStatus,
    };
}
