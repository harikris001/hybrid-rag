import { Link, useLocation } from "react-router-dom";
import MaterialIcon from "../icons/MaterialIcon";

interface TopAppBarProps {
  onMenuClick?: () => void;
  onLibraryClick?: () => void;
}

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Chat", to: "/chat" },
];

export default function TopAppBar({ onMenuClick, onLibraryClick }: TopAppBarProps) {
  const location = useLocation();

  return (
    <header className="flex justify-between items-center px-lg h-16 fixed top-0 left-0 right-0 z-40 md:left-[280px] border-b border-outline-variant bg-surface/80 backdrop-blur-md">
      {/* Mobile: hamburger + brand */}
      <div className="flex items-center gap-md md:hidden">
        <button onClick={onMenuClick} className="cursor-pointer">
          <MaterialIcon icon="menu" className="text-on-surface" />
        </button>
        <span className="text-headline-md font-bold tracking-tight text-primary">
          Nexus RAG
        </span>
      </div>

      {/* Desktop: centered tab navigation */}
      <nav className="hidden md:flex gap-xl mx-auto">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.label}
              to={link.to}
              className={`
                text-body-sm pb-1 transition-all duration-300
                ${
                  isActive
                    ? "text-primary border-b-2 border-primary font-medium"
                    : "text-on-surface-variant hover:text-primary"
                }
              `}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={onLibraryClick}
          className="text-body-sm pb-1 transition-all duration-300 text-on-surface-variant hover:text-primary cursor-pointer"
        >
          Library
        </button>
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-md ml-auto md:ml-0">
        <button 
          onClick={onLibraryClick}
          className="hidden lg:flex px-md py-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors rounded-lg text-body-sm font-medium items-center gap-sm cursor-pointer"
        >
          <MaterialIcon icon="database" size={16} />
          Connect Data
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
