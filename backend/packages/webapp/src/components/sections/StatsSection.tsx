"use client";

import { Database, Globe, TrendingUp, Users } from "lucide-react";

const StatsSection = () => {
  const stats = [
    {
      icon: Database,
      label: "Datasets",
      value: "5,000+",
      color: "text-blue-400",
    },
    {
      icon: Users,
      label: "AI Researchers",
      value: "25,000+",
      color: "text-purple-400",
    },
    {
      icon: TrendingUp,
      label: "Downloads",
      value: "500K+",
      color: "text-cyan-400",
    },
    { icon: Globe, label: "Industries", value: "50+", color: "text-green-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`bg-gray-800/90 backdrop-blur-md rounded-xl p-6 text-center transition-all duration-500 transform hover:scale-105 border border-gray-700 hover:border-gray-600 animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <stat.icon
              className={`w-8 h-8 ${stat.color} mx-auto mb-3 animate-float`}
              style={{ animationDelay: `${index * 0.5}s` }}
            />
            <div className="text-2xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <div className="text-gray-300">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsSection;
