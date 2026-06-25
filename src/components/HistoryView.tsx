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
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Generation History</h2>
            <p className="text-dark-400 mt-1">View your previously generated modules</p>
          </div>
        </div>

        <div className="space-y-3">
          {mockHistory.map((item) => (
            <div
              key={item.id}
              className="glass rounded-xl p-4 hover:bg-dark-700/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{item.moduleName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-dark-400" />
                      <span className="text-xs text-dark-400">{formatTimeAgo(item.createdAt)}</span>
                      {item.deploymentStrategy === 'github' ? (
                        <span className="badge badge-github text-xs ml-2">
                          <Github className="w-3 h-3 mr-1" />
                          GitHub
                        </span>
                      ) : (
                        <span className="badge badge-zip text-xs ml-2">
                          <FileArchive className="w-3 h-3 mr-1" />
                          ZIP
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <button className="p-2 text-dark-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockHistory.length === 0 && (
          <div className="text-center py-12">
            <FileCode className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-400">No generation history yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
