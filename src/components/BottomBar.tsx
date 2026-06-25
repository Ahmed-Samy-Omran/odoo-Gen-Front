import React from 'react';
import { GitBranch, Download, Loader2, CheckCircle, XCircle, Github, FileArchive } from 'lucide-react';

interface BottomBarProps {
  status: 'idle' | 'generating' | 'success' | 'error';
  statusMessage?: string;
  deploymentStrategy?: 'github' | 'local_zip';
}

export const BottomBar: React.FC<BottomBarProps> = ({
  status = 'idle',
  statusMessage,
  deploymentStrategy = 'local_zip'
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-primary-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <GitBranch className="w-4 h-4 text-dark-400" />;
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

    if (deploymentStrategy === 'github') {
      return (
        <span className="badge badge-github flex items-center gap-1.5">
          <Github className="w-3 h-3" />
          Deploying to GitHub
        </span>
      );
    }

    return (
      <span className="badge badge-zip flex items-center gap-1.5">
        <FileArchive className="w-3 h-3" />
        Preparing ZIP
      </span>
    );
  };

  return (
    <div className="fixed bottom-0 left-16 lg:left-64 right-0 h-12 bg-dark-800/90 border-t border-dark-700/50 flex items-center justify-between px-4 backdrop-blur-sm z-40">
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <span className="text-sm text-dark-300">
          {statusMessage || getDefaultMessage()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {getDeploymentBadge()}

        {status === 'success' && deploymentStrategy === 'local_zip' && (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 text-primary-300 rounded-lg border border-primary-500/30 hover:bg-primary-500/30 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </button>
        )}

        {status === 'success' && deploymentStrategy === 'github' && (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
            <Github className="w-4 h-4" />
            <span className="text-sm">View Repository</span>
          </button>
        )}
      </div>
    </div>
  );
};
