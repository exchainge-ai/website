"use client";

import { Download, Search, ShoppingCart } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      title: "Discover",
      description: "Browse our curated collection of physical AI datasets",
      color: "blue",
    },
    {
      icon: ShoppingCart,
      title: "Purchase",
      description: "Secure transactions with instant access to your data",
      color: "green",
    },
    {
      icon: Download,
      title: "Deploy",
      description: "Download and integrate datasets into your AI models",
      color: "cyan",
    },
  ];

  return (
    <div className="bg-gray-800 py-20 relative" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 font-medium">
            Simple steps to access world-class AI datasets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.title} className="text-center">
              <div
                className={`w-20 h-20 bg-${step.color}-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-${step.color}-500/30`}
              >
                <step.icon className={`w-10 h-10 text-${step.color}-400`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-300 font-medium leading-relaxed">
                {step.description}
              </p>
              <div className="mt-6">
                <span
                  className={`inline-block w-8 h-1 bg-${step.color}-500 rounded-full`}
                ></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
