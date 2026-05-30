import MaterialIcon from "../icons/MaterialIcon";

export interface FileItemData {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  size: string;
  dateAdded: string;
  icon: string;
  iconColor: string;
  iconBgClass: string;
  iconBorderClass: string;
  status: "indexed" | "embedding";
  embeddingProgress?: number;
}

interface FileItemProps {
  file: FileItemData;
}

export default function FileItem({ file }: FileItemProps) {
  const isEmbedding = file.status === "embedding";

  return (
    <div
      className={`
        grid grid-cols-12 gap-sm items-center p-md rounded-lg transition-all group cursor-pointer relative overflow-hidden
        ${
          isEmbedding
            ? "border border-outline-variant bg-surface-container-low"
            : "border border-transparent hover:border-outline-variant hover:bg-surface-container-low"
        }
      `}
    >
      {/* Processing progress bar */}
      {isEmbedding && (
        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
          <div
            className="h-full bg-primary animate-pulse"
            style={{ width: `${file.embeddingProgress ?? 0}%` }}
          />
        </div>
      )}

      {/* File name & status */}
      <div className="col-span-6 flex items-center gap-md">
        <div
          className={`w-10 h-10 rounded ${file.iconBgClass} flex items-center justify-center shrink-0 border ${file.iconBorderClass}`}
        >
          <MaterialIcon
            icon={file.icon}
            filled
            size={20}
            className={file.iconColor}
          />
        </div>
        <div className="truncate">
          <p className="text-body-md text-on-surface truncate group-hover:text-primary transition-colors">
            {file.name}
          </p>
          <div className="flex items-center gap-xs mt-xs">
            {isEmbedding ? (
              <>
                <MaterialIcon
                  icon="sync"
                  size={12}
                  className="text-primary animate-spin"
                />
                <span className="font-mono text-[10px] text-primary">
                  Embedding... ({file.embeddingProgress}%)
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] text-on-surface-variant">
                  Indexed
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Type */}
      <div className="col-span-2 text-label-mono text-on-surface-variant">
        {file.typeLabel}
      </div>

      {/* Size */}
      <div className="col-span-2 text-label-mono text-on-surface-variant">
        {file.size}
      </div>

      {/* Date & overflow menu */}
      <div className="col-span-2 flex items-center justify-between">
        <span className="text-label-mono text-on-surface-variant">
          {file.dateAdded}
        </span>
        <button className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-on-surface transition-opacity p-xs rounded hover:bg-surface-variant cursor-pointer">
          <MaterialIcon icon="more_vert" size={18} />
        </button>
      </div>
    </div>
  );
}
