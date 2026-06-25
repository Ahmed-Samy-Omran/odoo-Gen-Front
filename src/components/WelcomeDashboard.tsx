import React from 'react';
import { Sparkles, Zap, Github, FileArchive, ArrowRight, CheckCircle } from 'lucide-react';

interface WelcomeDashboardProps {
  onStartGenerating: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ onStartGenerating }) => {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Generation',
      description: 'Describe your module and let AI generate the complete code structure',
    },
    {
      icon: Github,
      title: 'GitHub Integration',
      description: 'Automatically push your generated modules to your GitHub repository',
    },
    {
      icon: FileArchive,
      title: 'Direct Download',
      description: 'Download your module as a ZIP file ready for Odoo deployment',
    },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-primary-500/25">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to <span className="gradient-text">Odoo Gen</span>
        </h1>
        <p className="text-xl text-dark-300 mb-8">
          Generate Odoo modules with AI. Choose between GitHub deployment or direct ZIP download.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="glass rounded-xl p-6 text-left hover:bg-dark-700/50 transition-colors">
              <feature.icon className="w-8 h-8 text-primary-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-dark-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStartGenerating}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold shadow-2xl shadow-primary-500/25 hover:scale-105 transition-transform"
        >
          Start Generating
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-dark-400">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            <span>Deploy to GitHub</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-dark-600" />
          <div className="flex items-center gap-2">
            <FileArchive className="w-4 h-4" />
            <span>Download as ZIP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
