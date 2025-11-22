"use client";

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black"></div>

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(rgba(59,130,246,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.3)_1px,transparent_1px)] bg-[size:50px_50px] animate-gradient-shift"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            ExchAInge
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
            The premier marketplace for specialized datasets powering physical
            AI applications. From robotics to autonomous systems, find the data
            that drives innovation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-blue-600"
            >
              <span className="relative z-10">Explore Datasets</span>
            </button>
            <button
              type="button"
              className="bg-gray-800 border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>List Your Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-float opacity-60"></div>
      <div
        className="absolute top-40 right-32 w-6 h-6 bg-purple-400 rounded-full animate-float opacity-40"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-32 left-40 w-3 h-3 bg-cyan-400 rounded-full animate-float opacity-50"
        style={{ animationDelay: "2s" }}
      ></div>
    </div>
  );
};

export default HeroSection;
