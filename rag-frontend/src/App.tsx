import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import SideNavBar from "./components/layout/SideNavBar";
import TopAppBar from "./components/layout/TopAppBar";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import FileLibraryModal from "./components/library/FileLibraryModal";
import { useConversations } from "./hooks/useConversations";
import { useChat } from "./hooks/useChat";
import { useDocuments } from "./hooks/useDocuments";
import { useMemory } from "./hooks/useMemory";
import MemoryToast from "./components/layout/MemoryToast";
import MemoryModal from "./components/layout/MemoryModal";
import type { Conversation } from "./types/types";

/**
 * ChatRoute – reads :conversationId from the URL and passes it
 * to useChat. If the user sends a message without a conversation,
 * one is auto-created first.
 */
function ChatRoute({
  activeConversationId,
  onSetConversationId,
  onStartNewConversation,
}: {
  activeConversationId: string | null;
  onSetConversationId: (id: string) => void;
  onStartNewConversation: () => Promise<Conversation | null>;
}) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  // Holds a message that was sent before a conversation existed,
  // so we can fire it once the conversation is ready.
  const pendingPromptRef = useRef<string | null>(null);

  // Sync URL param → parent state
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      onSetConversationId(conversationId);
    }
  }, [conversationId, activeConversationId, onSetConversationId]);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    activeTool,
    handleStreamSend,
    stopStreaming,
  } = useChat(activeConversationId);

  // When activeConversationId becomes available and we have a pending message, send it
  useEffect(() => {
    if (activeConversationId && pendingPromptRef.current) {
      const prompt = pendingPromptRef.current;
      pendingPromptRef.current = null;
      handleStreamSend(prompt);
    }
  }, [activeConversationId, handleStreamSend]);

  // Wrapper: auto-create a conversation if none exists, then send
  const handleSend = useCallback(
    async (prompt: string) => {
      if (activeConversationId) {
        // Conversation exists – send directly
        handleStreamSend(prompt);
      } else {
        // No conversation yet – create one first
        pendingPromptRef.current = prompt;
        const newConv = await onStartNewConversation();
        if (newConv) {
          navigate(`/chat/${newConv.id}`, { replace: true });
        }
      }
    },
    [activeConversationId, handleStreamSend, onStartNewConversation, navigate]
  );

  return (
    <ChatPage
      messages={messages}
      isLoading={isLoading}
      isStreaming={isStreaming}
      error={error}
      onSend={handleSend}
      onStopStreaming={stopStreaming}
      activeTool={activeTool}
    />
  );
}

function AppLayout() {
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ── Conversations hook ────────────────────────────────────
  const {
    conversations,
    activeConversationId,
    startNewConversation,
    selectConversation,
    deleteAnyConversation,
    updateConversationTitle,
  } = useConversations();

  // Determine the current chat title if we're on a chat page
  const isChatRoute = location.pathname.startsWith("/chat");
  const chatMatch = location.pathname.match(/^\/chat\/([^/]+)/);
  const currentChatId = chatMatch ? chatMatch[1] : activeConversationId;
  const activeConversation = conversations.find((c) => c.id === currentChatId);
  const currentChatTitle = isChatRoute
    ? (activeConversation ? activeConversation.title : "New Chat")
    : null;

  // ── Documents hook ────────────────────────────────────────
  const {
    files,
    isLoading: docsLoading,
    isUploading,
    uploadStatus,
    error: docsError,
    loadDocuments,
    upload,
  } = useDocuments();

  // ── Memory hook ────────────────────────────────────────────
  const {
    profile: memoryProfile,
    toast: memoryToast,
    dismissToast: dismissMemoryToast,
    deleteInterest,
    deletePreference,
    clearMemory,
  } = useMemory();

  // Handlers

  const handleNewChat = async () => {
    const newConv = await startNewConversation();
    if (newConv) {
      navigate(`/chat/${newConv.id}`);
    }
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    navigate(`/chat/${id}`);
  };

  const handleDeleteConversation = (id: string) => {
    deleteAnyConversation(id);
    navigate(`/`);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Side Navigation */}
      <SideNavBar
        isOpen={sideNavOpen}
        onClose={() => setSideNavOpen(false)}
        onFilesClick={() => setLibraryModalOpen(true)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onUpdateConversationTitle={updateConversationTitle}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-full relative w-full max-w-full">
        {/* Top App Bar */}
        <TopAppBar
          onMenuClick={() => setSideNavOpen(true)}
          onLibraryClick={() => setLibraryModalOpen(true)}
          onMemoriesClick={() => setMemoryModalOpen(true)}
          currentChatTitle={currentChatTitle}
        />

        {/* Page Content */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/chat/:conversationId?"
            element={
              <ChatRoute
                activeConversationId={activeConversationId}
                onSetConversationId={selectConversation}
                onStartNewConversation={startNewConversation}
              />
            }
          />
        </Routes>
      </div>

      {/* File Library Modal */}
      <FileLibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        files={files}
        isLoading={docsLoading}
        isUploading={isUploading}
        uploadStatus={uploadStatus}
        error={docsError}
        onUpload={upload}
        onLoadDocuments={loadDocuments}
      />

      {/* Memory Modal */}
      <MemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        profile={memoryProfile}
        onDeleteInterest={deleteInterest}
        onDeletePreference={deletePreference}
        onClearMemory={clearMemory}
      />

      {/* Memory Update Toast */}
      <MemoryToast event={memoryToast} onDismiss={dismissMemoryToast} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
