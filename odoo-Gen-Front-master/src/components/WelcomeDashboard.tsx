import React from 'react';
import { Sparkles, Building2, ShoppingCart, Home, Dumbbell } from 'lucide-react';

interface WelcomeDashboardProps {
  onSelectTemplate: (template: string) => void;
}

const templates = [
  {
    title: 'Gym Management',
    description: 'Members, trainers, subscriptions',
    icon: Dumbbell,
    prompt: 'Create a gym management system with members, trainers, membership plans, and class scheduling',
  },
  {
    title: 'E-commerce App',
    description: 'Products, orders, customers',
    icon: ShoppingCart,
    prompt: 'Build an e-commerce platform with products, categories, orders, customers, and inventory tracking',
  },
  {
    title: 'Real Estate CRM',
    description: 'Properties, clients, deals',
    icon: Home,
    prompt: 'Design a real estate CRM with properties, clients, agents, property viewings, and deal tracking',
  },
];

const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ onSelectTemplate }) => {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="text-center max-w-2xl px-6 space-y-8">
        {/* Glowing AI Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/15">
              <Sparkles className="w-10 h-10 text-white/80" />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-white/10 blur-xl animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-white/5 blur-md" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-white/90 tracking-tight">
            Odoo AI Module Architect
          </h1>
          <p className="text-white/40 text-lg leading-relaxed max-w-lg mx-auto">
            Type your requirements below to generate your database schema, models, and relationships visually.
          </p>
        </div>

        {/* Template Cards */}
        <div className="pt-4">
          <p className="text-white/25 text-sm mb-4 uppercase tracking-wider font-medium">
            Quick Start Templates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.title}
                  onClick={() => onSelectTemplate(template.prompt)}
                  className="group p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Icon className="w-5 h-5 text-white/50 group-hover:text-white/70 transition-colors" />
                    </div>
                  </div>
                  <h3 className="text-white/70 font-medium text-sm group-hover:text-white/90 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-white/30 text-xs mt-1">
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        <div className="pt-6">
          <p className="text-white/20 text-xs flex items-center justify-center gap-2">
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 font-mono">Enter</span>
            <span>to submit your prompt</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;
