import React from 'react';
import { Clock, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  moduleName: string;
  timestamp: Date;
  status: 'completed' | 'failed' | 'processing';
  modelCount: number;
}

interface HistoryViewProps {
  items: HistoryItem[];
  onLoadModule: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ items, onLoadModule }) => {
  const getStatusIcon = (status: HistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-white/70" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-white/50" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-white/60 animate-spin" />;
    }
  };

  const getStatusBadge = (status: HistoryItem['status']) => {
    const colors = {
      completed: 'bg-white/8 text-white/70 border-white/15',
      failed: 'bg-white/5 text-white/50 border-white/10',
      processing: 'bg-white/6 text-white/60 border-white/12',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[status]} capitalize flex items-center gap-1`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white/90">Module History</h1>
            <p className="text-white/30 text-sm mt-1">Previously generated Odoo modules</p>
          </div>
          <div className="flex items-center gap-2 text-white/25 text-sm">
            <Clock className="w-4 h-4" />
            <span>{items.length} modules</span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-obsidian-100 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-white/15" />
            </div>
            <h3 className="text-lg font-medium text-white/50">No modules yet</h3>
            <p className="text-white/25 text-sm mt-1">Generated modules will appear here</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-card-hover p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/15">
                  <span className="font-mono text-white/80 font-semibold">
                    {item.modelCount}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono text-white/80 truncate">{item.moduleName}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-white/30 text-sm mt-1">{formatDate(item.timestamp)}</p>
                </div>

                <button
                  onClick={() => onLoadModule(item.id)}
                  disabled={item.status !== 'completed'}
                  className={`cyber-button-primary gap-2 ${
                    item.status !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>Load</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
