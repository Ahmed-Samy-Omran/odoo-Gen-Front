import React from 'react';
import AiIcon from './AiIcon';
import { Zap, Github, FileArchive, ArrowRight } from 'lucide-react';

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
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="text-center max-w-2xl px-6 space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/15">
              <AiIcon className="w-10 h-10 text-white/80" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-white/10 blur-xl animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-white/5 blur-md" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-white/90 tracking-tight">
            Odoo Gen
          </h1>
          <p className="text-white/40 text-lg leading-relaxed max-w-lg mx-auto">
            Generate Odoo modules with AI. Choose between GitHub deployment or direct ZIP download.
          </p>
        </div>

        <div className="pt-4">
          <p className="text-white/25 text-sm mb-4 uppercase tracking-wider font-medium">
            Features
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Icon className="w-5 h-5 text-white/50 group-hover:text-white/70 transition-colors" />
                    </div>
                  </div>
                  <h3 className="text-white/70 font-medium text-sm group-hover:text-white/90 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/30 text-xs mt-1">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onStartGenerating}
          className="cyber-button-accent gap-2 px-8 py-3"
        >
          Start Generating
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-6 text-sm text-white/25">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            <span>Deploy to GitHub</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-2">
            <FileArchive className="w-4 h-4" />
            <span>Download as ZIP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
