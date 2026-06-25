import React from 'react';
import { FileCode, Folder, FolderOpen, File, Loader2 } from 'lucide-react';

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
  isLoading?: boolean;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  files = [],
  selectedFile,
  onSelectFile,
  deploymentStrategy,
  repositoryUrl,
  isLoading = false,
}) => {
  const getSelectedContent = (): string | null => {
    if (!Array.isArray(files) || files.length === 0 || !selectedFile) return null;
    return files.find(f => f?.path === selectedFile)?.content || null;
  };

  const buildFileTree = (): { [key: string]: string[] } => {
    const tree: { [key: string]: string[] } = {};

    // Safety check: ensure files exists and is an array before iterating
    if (!Array.isArray(files) || files.length === 0) {
      return tree;
    }

    files.forEach(file => {
      if (!file?.path) return; // Skip invalid entries

      const parts = file.path.split('/');
      const dir = parts.slice(0, -1).join('/') || '/';
      if (!tree[dir]) tree[dir] = [];
      const fileName = parts[parts.length - 1];
      if (fileName) {
        tree[dir].push(fileName);
      }
    });

    return tree;
  };

  const fileTree = buildFileTree();
  const selectedContent = getSelectedContent();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-900/50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading generated files...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!Array.isArray(files) || files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-900/50">
        <div className="text-center">
          <Folder className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <p className="text-dark-400">No files generated yet</p>
          <p className="text-dark-500 text-sm mt-1">Configure your module and click Generate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-64 bg-dark-800/50 border-r border-dark-700/50 overflow-auto">
        <div className="p-3 border-b border-dark-700/50">
          <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Files</h3>
        </div>

        <div className="p-2 space-y-0.5">
          {Object.entries(fileTree).map(([dir, filenames]) => (
            <div key={dir}>
              <div className="flex items-center gap-2 px-2 py-1.5 text-dark-300 text-xs">
                <FolderOpen className="w-3.5 h-3.5 text-yellow-500" />
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
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'text-dark-400 hover:bg-dark-700/50 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{filename}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700/50 bg-dark-800/30">
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-dark-400" />
            <span className="text-sm text-dark-300">
              {selectedFile ? selectedFile.split('/').pop() : 'No file selected'}
            </span>
          </div>

          {deploymentStrategy === 'github' && repositoryUrl && (
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              View on GitHub
            </a>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-dark-900/20">
          {selectedContent ? (
            <pre className="p-4 text-sm font-mono text-dark-300 whitespace-pre-wrap">
              <code>{selectedContent}</code>
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Folder className="w-16 h-16 text-dark-500 mb-4" />
              <p className="text-dark-400">Select a file to preview its contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
