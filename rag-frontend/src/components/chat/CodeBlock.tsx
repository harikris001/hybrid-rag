import MaterialIcon from "../icons/MaterialIcon";

interface CodeBlockProps {
  language: string;
  children: React.ReactNode;
}

export default function CodeBlock({ language, children }: CodeBlockProps) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden mt-sm">
      {/* Header bar */}
      <div className="flex justify-between items-center px-md py-sm border-b border-outline-variant bg-surface-container-low">
        <span className="text-label-mono text-on-surface-variant">{language}</span>
        <button className="text-on-surface-variant hover:text-on-surface flex items-center gap-xs transition-colors cursor-pointer">
          <MaterialIcon icon="content_copy" size={16} />
          <span className="text-label-mono">Copy</span>
        </button>
      </div>
      {/* Code content */}
      <pre className="p-md overflow-x-auto">
        <code className="text-label-mono">{children}</code>
      </pre>
    </div>
  );
}
