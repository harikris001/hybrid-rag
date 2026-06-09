import { Link, useLocation } from "react-router-dom";
import MaterialIcon from "../icons/MaterialIcon";

interface TopAppBarProps {
  onMenuClick?: () => void;
  onLibraryClick?: () => void;
  onMemoriesClick?: () => void;
  currentChatTitle?: string | null;
}

export default function TopAppBar({
  onMenuClick,
  onMemoriesClick,
  currentChatTitle,
}: TopAppBarProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="flex justify-between items-center px-lg h-16 fixed top-0 left-0 right-0 z-40 md:left-[280px] border-b border-outline-variant bg-surface/80 backdrop-blur-md">
      {/* Left section: menu button (mobile only) + logo/title */}
      <div className="flex items-center gap-md">
        <button
          onClick={onMenuClick}
          className="md:hidden cursor-pointer flex items-center justify-center p-xs hover:bg-surface-container rounded-full transition-colors"
          aria-label="Open navigation menu"
        >
          <MaterialIcon icon="menu" className="text-on-surface" />
        </button>

        {isHome ? (
          // Logo of the app
          <Link to="/" className="flex items-center gap-sm select-none hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden shrink-0">
              <MaterialIcon icon="auto_awesome" filled className="text-on-primary-container" size={18} />
            </div>
            <span className="text-headline-md font-bold tracking-tight text-primary">
              Nexus RAG
            </span>
          </Link>
        ) : (
          // Current Chat Name
          <div className="flex items-center gap-sm max-w-[180px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]">
            <MaterialIcon icon="chat_bubble_outline" size={20} className="text-primary shrink-0" />
            <span className="text-body-lg font-semibold text-on-surface truncate">
              {currentChatTitle || "New Chat"}
            </span>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-md ml-auto md:ml-0">
        <button
          onClick={onMemoriesClick}
          className="hidden lg:flex px-md py-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors rounded-lg text-body-sm font-medium items-center gap-sm cursor-pointer"
        >
          <MaterialIcon icon="psychology" size={16} />
          Memories
        </button>
        <div className="flex items-center gap-sm text-on-surface-variant">
          <button className="hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container cursor-pointer">
            <MaterialIcon icon="notifications" size={20} />
          </button>
          <button className="hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container cursor-pointer">
            <MaterialIcon icon="help" size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden ml-2 flex items-center justify-center cursor-pointer">
            <MaterialIcon icon="person" size={18} className="text-outline" />
          </div>
        </div>
      </div>
    </header>
  );
}
