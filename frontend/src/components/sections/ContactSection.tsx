"use client";

import { Mail } from "lucide-react";

const ContactSection = () => {
  return (
    <div className="bg-gray-800 py-16 relative" id="contact">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800"></div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Get In Touch
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Have questions? We'd love to hear from you.
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-400 transition-all duration-300 group">
          <Mail className="w-6 h-6 animate-float" />
          <a
            href="mailto:marketing@exchainge.com"
            className="text-xl font-semibold hover:text-blue-300 transition-colors group-hover:scale-105 transform duration-300"
          >
            marketing@exchainge.net
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
