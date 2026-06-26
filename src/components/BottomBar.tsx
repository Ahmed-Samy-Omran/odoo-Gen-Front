import React from 'react';
import { GitBranch, Download, Loader2, CheckCircle, XCircle, Github, FileArchive } from 'lucide-react';

interface BottomBarProps {
  status: 'idle' | 'generating' | 'success' | 'error';
  statusMessage?: string;
  deploymentStrategy?: 'github' | 'local_zip';
  progress?: number;
  downloadUrl?: string;
  repositoryUrl?: string;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  status = 'idle',
  statusMessage,
  deploymentStrategy = 'local_zip',
  progress = 0,
  downloadUrl,
  repositoryUrl,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-white/60" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-white/70" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-white/50" />;
      default:
        return <GitBranch className="w-4 h-4 text-white/40" />;
    }
  };

  const getDefaultMessage = () => {
    switch (status) {
      case 'generating':
        return 'Generating module...';
      case 'success':
        return 'Module generated successfully';
      case 'error':
        return 'Generation failed';
      default:
        return 'Ready to generate';
    }
  };

  const getDeploymentBadge = () => {
    if (status !== 'generating' && status !== 'success') return null;

    const currentDeploymentStrategy = deploymentStrategy ?? 'local_zip';

    if (currentDeploymentStrategy === 'github') {
      return (
        <span className="command-context-badge">
          <Github className="w-3 h-3" />
          <span>GitHub</span>
        </span>
      );
    }

    return (
      <span className="command-context-badge">
        <FileArchive className="w-3 h-3" />
        <span>ZIP</span>
      </span>
    );
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleOpenRepo = () => {
    if (repositoryUrl) {
      window.open(repositoryUrl, '_blank');
    }
  };

  return (
    <div className="command-bar-container">
      <div className="command-bar">
        <div className="command-action-btn pointer-events-none">
          {getStatusIcon()}
        </div>

        <div className="command-divider" />

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="command-input truncate">
            {statusMessage ?? getDefaultMessage()}
          </span>
          {status === 'generating' && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/40 transition-all duration-500"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <span className="text-[10px] text-white/30 tabular-nums w-8 text-right">
                {progress}%
              </span>
            </div>
          )}
        </div>

        {getDeploymentBadge()}

        {status === 'success' && (deploymentStrategy ?? 'local_zip') === 'local_zip' && downloadUrl && (
          <button type="button" className="command-execute-btn" title="Download" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </button>
        )}

        {status === 'success' && (deploymentStrategy ?? 'local_zip') === 'github' && repositoryUrl && (
          <button type="button" className="command-execute-btn" title="View Repository" onClick={handleOpenRepo}>
            <Github className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
