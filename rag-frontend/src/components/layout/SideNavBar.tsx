import { Link, useLocation } from "react-router-dom";
import type { Conversation } from "../../types/types";
import MaterialIcon from "../icons/MaterialIcon";
import type { NavItemProps } from "../../types/types";
import { useState } from "react";

function NavItem({
  icon,
  label,
  to,
  active = false,
  textSize = "text-label-mono",
  onClick,
}: NavItemProps) {
  const baseClasses =
    "flex items-center gap-md w-full py-sm hover:bg-surface-container-highest transition-colors duration-200 text-left cursor-pointer";
  const activeClasses = active
    ? "text-primary font-bold border-l-2 border-primary pl-4"
    : "text-on-surface-variant font-medium pl-4";

  const content = (
    <>
      <MaterialIcon
        icon={icon}
        className={`${active ? "text-primary" : "text-outline"} group-hover:text-primary transition-colors`}
      />
      <span className={textSize}>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${activeClasses} group`} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button className={`${baseClasses} ${activeClasses} group`} onClick={onClick}>
      {content}
    </button>
  );
}

interface SideNavBarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onFilesClick?: () => void;
  conversations?: Conversation[];
  activeConversationId?: string | null;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onUpdateConversationTitle?: (id: string, title: string) => void;
}

export default function SideNavBar({
  isOpen = false,
  onClose,
  onFilesClick,
  conversations = [],
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversationTitle,
}: SideNavBarProps) {
  const location = useLocation();
  const isChatActive = location.pathname.startsWith("/chat");

  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          flex flex-col h-screen w-[280px] fixed left-0 top-0
          border-r border-outline-variant bg-surface-container
          py-lg px-md z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-md mb-xl px-sm">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden shrink-0">
            <MaterialIcon icon="auto_awesome" filled className="text-on-primary-container" size={22} />
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-primary">Nexus RAG</h1>
            <p className="text-body-sm text-on-surface-variant">
              AI-Powered Intelligence
            </p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-sm">
          <NavItem
            icon="add_circle"
            label="New Chat"
            active={isChatActive && !activeConversationId}
            onClick={() => {
              onNewChat?.();
              onClose?.();
            }}
          />
          <NavItem icon="folder_open" label="Files" onClick={() => { onFilesClick?.(); onClose?.(); }} />
        </nav>

        {/* Conversation History */}
        {conversations.length > 0 && (
          <div className="mt-lg flex flex-col gap-xs flex-1 overflow-y-auto">
            <span className="text-label-mono text-on-surface-variant px-sm mb-xs">
              HISTORY
            </span>
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation?.(conv.id);
                    onClose?.();
                  }}
                  className={`
                    flex items-center gap-sm w-full py-sm px-sm rounded-lg text-left transition-colors duration-200 cursor-pointer truncate group
                    ${isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-on-surface-variant hover:bg-surface-container-highest border border-transparent"
                    }
                  `}
                >
                  <MaterialIcon
                    icon="chat_bubble_outline"
                    size={16}
                    className={isActive ? "text-primary" : "text-outline"}
                  />
                  <span className="text-body-sm truncate flex-1">
                    {editingConversationId === conv.id ? (
                      <input 
                        type="text" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            if (onUpdateConversationTitle && editTitle.trim() !== "") {
                              onUpdateConversationTitle(conv.id, editTitle);
                            }
                            setEditingConversationId(null);
                          }
                        }}
                        onBlur={() => setEditingConversationId(null)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="bg-transparent border-b border-primary outline-none w-full text-primary"
                      />
                    ) : (
                      conv.title
                    )}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingConversationId(conv.id);
                        setEditTitle(conv.title);
                      }} 
                      className="hover:bg-black/5 rounded p-1"
                    >
                      <MaterialIcon icon="edit" className="text-outline" size={18} />
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteConversation) onDeleteConversation(conv.id);
                    }} className="hover:bg-error/10 rounded p-1">
                      <MaterialIcon icon="delete" className="text-error" size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Spacer if no conversations */}
        {conversations.length === 0 && <div className="flex-1" />}

        {/* Bottom Section */}
        <div className="mt-auto flex flex-col gap-sm pt-lg border-t border-outline-variant">
          <button className="w-full py-sm px-md mb-md bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors rounded flex items-center justify-center gap-sm cursor-pointer">
            <MaterialIcon icon="star" className="text-tertiary" />
            <span className="text-body-sm font-medium">Star on Github</span>
          </button>
          <NavItem icon="settings" label="Settings" textSize="text-label-mono" />
          <NavItem icon="person" label="Account" textSize="text-label-mono" />
        </div>
      </aside>
    </>
  );
}
