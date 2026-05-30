import { useEffect, useRef } from "react";
import MaterialIcon from "../icons/MaterialIcon";

interface FileLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: string[];
  isLoading: boolean;
  isUploading: boolean;
  uploadStatus: string | null;
  error: string | null;
  onUpload: (file: File) => void;
  onLoadDocuments: () => void;
}

/** Map a file extension to display metadata. */
function getFileDisplay(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { icon: string; iconColor: string; iconBgClass: string; iconBorderClass: string; typeLabel: string }> = {
    pdf:  { icon: "picture_as_pdf", iconColor: "text-error",              iconBgClass: "bg-error-container/20",     iconBorderClass: "border-error-container/30",     typeLabel: "PDF Document" },
    docx: { icon: "description",    iconColor: "text-secondary",          iconBgClass: "bg-secondary-container/20", iconBorderClass: "border-secondary-container/30", typeLabel: "Word Document" },
    doc:  { icon: "description",    iconColor: "text-secondary",          iconBgClass: "bg-secondary-container/20", iconBorderClass: "border-secondary-container/30", typeLabel: "Word Document" },
    csv:  { icon: "dataset",        iconColor: "text-tertiary",           iconBgClass: "bg-tertiary-container/20",  iconBorderClass: "border-tertiary-container/30",  typeLabel: "CSV Data" },
    txt:  { icon: "article",        iconColor: "text-on-surface-variant", iconBgClass: "bg-surface-variant",        iconBorderClass: "border-outline-variant",        typeLabel: "Text File" },
    md:   { icon: "article",        iconColor: "text-on-surface-variant", iconBgClass: "bg-surface-variant",        iconBorderClass: "border-outline-variant",        typeLabel: "Markdown" },
  };
  return map[ext] ?? { icon: "insert_drive_file", iconColor: "text-on-surface-variant", iconBgClass: "bg-surface-variant", iconBorderClass: "border-outline-variant", typeLabel: ext.toUpperCase() || "File" };
}

export default function FileLibraryModal({
  isOpen,
  onClose,
  files,
  isLoading,
  isUploading,
  uploadStatus,
  error,
  onUpload,
  onLoadDocuments,
}: FileLibraryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents when modal opens
  useEffect(() => {
    if (isOpen) {
      onLoadDocuments();
    }
  }, [isOpen, onLoadDocuments]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      // Reset so re-uploading the same file triggers onChange
      e.target.value = "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-background/80 backdrop-blur-sm animate-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container */}
      <div className="w-full max-w-3xl bg-surface border border-outline-variant rounded-xl shadow-2xl ai-glow flex flex-col max-h-[870px] overflow-hidden animate-modal-content">
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-lg border-b border-outline-variant bg-surface-container-lowest">
          <div>
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-sm">
              <MaterialIcon icon="folder_managed" className="text-primary" />
              Data Library
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Manage documents available for retrieval-augmented generation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-sm rounded-lg hover:bg-surface-variant cursor-pointer"
          >
            <MaterialIcon icon="close" />
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="p-md flex items-center justify-between border-b border-outline-variant bg-surface">
          {/* Search */}
          <div className="relative w-64">
            <MaterialIcon
              icon="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-sm py-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-on-surface-variant outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-md">
            <button className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-label-mono text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">
              <MaterialIcon icon="filter_list" size={16} />
              Filter
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.csv,.md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-label-caps tracking-wide hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(194,193,255,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MaterialIcon icon={isUploading ? "sync" : "upload"} size={18} className={isUploading ? "animate-spin" : ""} />
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>

        {/* ── Status / Error banners ── */}
        {(uploadStatus || error) && (
          <div className="px-md pt-md flex flex-col gap-sm">
            {uploadStatus && (
              <div className="flex items-center gap-sm p-sm bg-primary/10 border border-primary/20 rounded-lg">
                <MaterialIcon icon="check_circle" className="text-primary" size={18} />
                <span className="text-body-sm text-primary">{uploadStatus}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-sm p-sm bg-error-container/20 border border-error/30 rounded-lg">
                <MaterialIcon icon="error" className="text-error" size={18} />
                <span className="text-body-sm text-error">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* ── File List ── */}
        <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-md">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-sm px-md py-xs mb-sm text-label-mono text-on-surface-variant border-b border-outline-variant/50 pb-sm">
            <div className="col-span-8 flex items-center gap-xs">
              File Name
              <MaterialIcon icon="arrow_downward" size={14} />
            </div>
            <div className="col-span-4 text-right">Type</div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-xl">
              <MaterialIcon icon="sync" size={20} className="animate-spin text-on-surface-variant" />
              <span className="text-body-sm text-on-surface-variant ml-sm">Loading files...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-xl text-center gap-sm">
              <MaterialIcon icon="cloud_upload" size={40} className="text-outline" />
              <p className="text-body-md text-on-surface-variant">No documents uploaded yet.</p>
              <p className="text-body-sm text-outline">Upload files to start building your knowledge base.</p>
            </div>
          )}

          {/* File rows */}
          <div className="flex flex-col gap-sm">
            {files.map((filename) => {
              const display = getFileDisplay(filename);
              return (
                <div
                  key={filename}
                  className="grid grid-cols-12 gap-sm items-center p-md rounded-lg transition-all group cursor-pointer border border-transparent hover:border-outline-variant hover:bg-surface-container-low"
                >
                  {/* File name */}
                  <div className="col-span-8 flex items-center gap-md">
                    <div className={`w-10 h-10 rounded ${display.iconBgClass} flex items-center justify-center shrink-0 border ${display.iconBorderClass}`}>
                      <MaterialIcon icon={display.icon} filled size={20} className={display.iconColor} />
                    </div>
                    <div className="truncate">
                      <p className="text-body-md text-on-surface truncate group-hover:text-primary transition-colors">
                        {filename}
                      </p>
                      <div className="flex items-center gap-xs mt-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          Indexed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="col-span-4 text-right text-label-mono text-on-surface-variant">
                    {display.typeLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-md border-t border-outline-variant bg-surface flex justify-between items-center">
          <div className="text-label-mono text-on-surface-variant flex items-center gap-sm">
            <MaterialIcon icon="storage" size={16} />
            {files.length} file{files.length !== 1 ? "s" : ""} uploaded
          </div>
          <button
            onClick={onClose}
            className="px-md py-sm rounded-lg text-label-caps text-on-surface-variant hover:bg-surface-variant transition-colors border border-transparent hover:border-outline-variant cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
