import React from 'react';
import { FileCode, Folder, FolderOpen, File, Loader2, Download } from 'lucide-react';

interface GeneratedFile {
  name: string;
  path: string;
  content: string;
}

interface CanvasViewProps {
  files: GeneratedFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  deploymentStrategy: 'github' | 'local_zip';
  repositoryUrl?: string;
  downloadUrl?: string;
  downloadFileName?: string;
  isLoading?: boolean;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  files = [],
  selectedFile,
  onSelectFile,
  deploymentStrategy,
  repositoryUrl,
  downloadUrl,
  downloadFileName,
  isLoading = false,
}) => {
  const getSelectedContent = (): string | null => {
    if (!Array.isArray(files) || files.length === 0 || !selectedFile) return null;
    return files.find(f => f?.path === selectedFile)?.content || null;
  };

  const buildFileTree = (): { [key: string]: string[] } => {
    const tree: { [key: string]: string[] } = {};
    if (!Array.isArray(files) || files.length === 0) return tree;

    files.forEach(file => {
      if (!file?.path) return;
      const parts = file.path.split('/');
      const dir = parts.slice(0, -1).join('/') || '/';
      if (!tree[dir]) tree[dir] = [];
      const fileName = parts[parts.length - 1];
      if (fileName) tree[dir].push(fileName);
    });

    return tree;
  };

  const fileTree = buildFileTree();
  const selectedContent = getSelectedContent();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white/50 animate-spin mx-auto mb-4" />
          <p className="text-white/30">Loading generated files...</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(files) || files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Folder className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/30">No files generated yet</p>
          <p className="text-white/20 text-sm mt-1">Configure your module and click Generate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-64 glass-card border-r border-glass-border overflow-auto flex-shrink-0">
        <div className="p-3 border-b border-glass-border">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Files</h3>
        </div>

        <div className="p-2 space-y-0.5">
          {Object.entries(fileTree).map(([dir, filenames]) => (
            <div key={dir}>
              <div className="flex items-center gap-2 px-2 py-1.5 text-white/50 text-xs">
                <FolderOpen className="w-3.5 h-3.5 text-white/40" />
                <span className="truncate">{dir === '/' ? 'module' : dir}</span>
              </div>
              {Array.isArray(filenames) && filenames.length > 0 && filenames.map((filename) => {
                const fullPath = dir === '/' ? filename : `${dir}/${filename}`;
                const isSelected = selectedFile === fullPath;
                return (
                  <button
                    key={fullPath}
                    onClick={() => onSelectFile(fullPath)}
                    className={`w-full flex items-center gap-2 pl-6 pr-2 py-1.5 text-sm rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-white/10 text-white/90 border border-white/15'
                        : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate font-mono text-xs">{filename}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-glass-border bg-black/50">
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/70 font-mono">
              {selectedFile ? selectedFile.split('/').pop() : 'No file selected'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {deploymentStrategy === 'local_zip' && downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadFileName}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                Download ZIP
              </a>
            )}

            {deploymentStrategy === 'github' && repositoryUrl && (
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                View on GitHub
              </a>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {selectedContent ? (
            <pre className="p-4 text-sm font-mono text-white/70 whitespace-pre-wrap">
              <code>{selectedContent}</code>
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Folder className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/30">Select a file to preview its contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
