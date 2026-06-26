import React from 'react';
import { Clock, FileCode, Trash2, Github, FileArchive } from 'lucide-react';

interface HistoryItem {
  id: string;
  moduleName: string;
  createdAt: Date;
  deploymentStrategy: 'github' | 'local_zip';
  status: 'success' | 'failed';
}

export const HistoryView: React.FC = () => {
  const mockHistory: HistoryItem[] = [
    {
      id: '1',
      moduleName: 'sale_extension',
      createdAt: new Date(Date.now() - 3600000),
      deploymentStrategy: 'github',
      status: 'success',
    },
    {
      id: '2',
      moduleName: 'inventory_tracker',
      createdAt: new Date(Date.now() - 7200000),
      deploymentStrategy: 'local_zip',
      status: 'success',
    },
    {
      id: '3',
      moduleName: 'hr_dashboard',
      createdAt: new Date(Date.now() - 86400000),
      deploymentStrategy: 'local_zip',
      status: 'failed',
    },
  ];

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white/90">Generation History</h1>
            <p className="text-white/30 text-sm mt-1">View your previously generated modules</p>
          </div>
          <div className="flex items-center gap-2 text-white/25 text-sm">
            <Clock className="w-4 h-4" />
            <span>{mockHistory.length} modules</span>
          </div>
        </div>

        {mockHistory.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <FileCode className="w-12 h-12 text-white/15 mb-4" />
            <p className="text-white/50">No generation history yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mockHistory.map((item) => (
              <div key={item.id} className="glass-card-hover p-5 flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/15">
                  <FileCode className="w-5 h-5 text-white/70" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono text-white/80 truncate">{item.moduleName}</h3>
                    <span className={`module-badge ${item.status === 'success' ? 'module-badge-core' : 'module-badge-api'}`}>
                      {item.status}
                    </span>
                    {item.deploymentStrategy === 'github' ? (
                      <span className="command-context-badge text-[10px]">
                        <Github className="w-3 h-3" />
                        GitHub
                      </span>
                    ) : (
                      <span className="command-context-badge text-[10px]">
                        <FileArchive className="w-3 h-3" />
                        ZIP
                      </span>
                    )}
                  </div>
                  <p className="text-white/30 text-sm mt-1">{formatTimeAgo(item.createdAt)}</p>
                </div>

                <button className="p-2 text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
