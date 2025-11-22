const CryptoBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03)_0%,transparent_50%)] animate-gradient-shift"></div>

      {/* Floating Crypto Symbols */}
      <div className="absolute top-1/4 left-1/6 text-6xl text-green-500/20 animate-float">
        ₿
      </div>
      <div
        className="absolute top-1/3 right-1/4 text-5xl text-blue-500/20 animate-float"
        style={{ animationDelay: "1s" }}
      >
        Ξ
      </div>
      <div
        className="absolute bottom-1/3 left-1/3 text-4xl text-brand-green-light/20 animate-float"
        style={{ animationDelay: "2s" }}
      >
        ◊
      </div>
      <div
        className="absolute top-2/3 right-1/6 text-5xl text-cyan-500/20 animate-float"
        style={{ animationDelay: "3s" }}
      >
        ₳
      </div>
      <div
        className="absolute bottom-1/4 right-1/3 text-6xl text-orange-500/20 animate-float"
        style={{ animationDelay: "4s" }}
      >
        Ł
      </div>

      {/* Matrix-style falling characters */}
      <div className="absolute top-0 left-1/12 text-green-600/30 text-xs font-mono animate-[float_6s_ease-in-out_infinite]">
        0101010101
      </div>
      <div
        className="absolute top-0 left-2/12 text-green-600/25 text-xs font-mono animate-[float_6s_ease-in-out_infinite]"
        style={{ animationDelay: "0.5s" }}
      >
        1010101010
      </div>
      <div
        className="absolute top-0 left-3/12 text-blue-600/30 text-xs font-mono animate-[float_6s_ease-in-out_infinite]"
        style={{ animationDelay: "1s" }}
      >
        HASH256
      </div>
      <div
        className="absolute top-0 left-4/12 text-brand-green-light/25 text-xs font-mono animate-[float_6s_ease-in-out_infinite]"
        style={{ animationDelay: "1.5s" }}
      >
        BLOCKCHAIN
      </div>
      <div
        className="absolute top-0 left-5/12 text-cyan-600/30 text-xs font-mono animate-[float_6s_ease-in-out_infinite]"
        style={{ animationDelay: "2s" }}
      >
        CRYPTO
      </div>

      {/* Pulsing gradient orbs */}
      <div className="absolute top-1/5 left-1/5 w-64 h-64 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-brand-green-light/10 rounded-full blur-3xl animate-crypto-pulse"></div>
      <div
        className="absolute bottom-1/4 right-1/5 w-80 h-80 bg-gradient-to-r from-brand-green-light/10 via-cyan-500/10 to-green-500/10 rounded-full blur-3xl animate-crypto-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/5 via-brand-green-light/5 to-cyan-500/5 rounded-full blur-3xl animate-glow-pulse"></div>

      {/* Hexagonal grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hexagons"
              x="0"
              y="0"
              width="50"
              height="43.4"
              patternUnits="userSpaceOnUse"
            >
              <polygon
                points="25,2 45,15 45,35 25,48 5,35 5,15"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-cyan-600/40"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#hexagons)"
            className="animate-gradient-shift"
          />
        </svg>
      </div>

      {/* Floating blockchain nodes */}
      <div className="absolute top-1/6 right-1/6 w-3 h-3 bg-green-500/60 rounded-full animate-pulse shadow-lg shadow-green-500/30"></div>
      <div
        className="absolute top-2/6 left-1/8 w-2 h-2 bg-blue-500/60 rounded-full animate-pulse shadow-lg shadow-blue-500/30"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute bottom-1/6 left-1/4 w-4 h-4 bg-brand-green-light/60 rounded-full animate-pulse shadow-lg shadow-brand-green-light/30"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-2/6 right-1/8 w-3 h-3 bg-cyan-500/60 rounded-full animate-pulse shadow-lg shadow-cyan-500/30"
        style={{ animationDelay: "1.5s" }}
      ></div>

      {/* Connecting lines between nodes */}
      <svg className="absolute inset-0 w-full h-full">
        <line
          x1="20%"
          y1="20%"
          x2="80%"
          y2="30%"
          stroke="url(#gradient1)"
          strokeWidth="1"
          opacity="0.4"
          className="animate-pulse"
        >
          <animate
            attributeName="stroke-dasharray"
            values="0,100;50,50;100,0;50,50;0,100"
            dur="4s"
            repeatCount="indefinite"
          />
        </line>
        <line
          x1="15%"
          y1="40%"
          x2="75%"
          y2="80%"
          stroke="url(#gradient2)"
          strokeWidth="1"
          opacity="0.4"
          className="animate-pulse"
          style={{ animationDelay: "1s" }}
        >
          <animate
            attributeName="stroke-dasharray"
            values="0,100;50,50;100,0;50,50;0,100"
            dur="4s"
            begin="1s"
            repeatCount="indefinite"
          />
        </line>
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="50%" stopColor="#06d6a0" stopOpacity="1" />
            <stop offset="100%" stopColor="#06d6a0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06d6a0" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#06d6a0" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default CryptoBackground;
