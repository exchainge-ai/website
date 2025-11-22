"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Zap, Star, Bot, Car, Factory, Hand } from "lucide-react";

export default function RequestPage() {
  const [step, setStep] = useState<"describe" | "budget" | "timeline">("describe");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section - Immediate Clarity */}
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm text-blue-400">Get exactly what you need</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-green-200 bg-clip-text text-transparent">
            Request Custom Data
          </h1>

          <p className="text-xl text-gray-400 leading-relaxed">
            Describe what you need and anyone can provide the data for request, verified.
            <br />
            <span className="text-gray-500">Simple, fast, verified.</span>
          </p>
        </motion.div>
      </div>

      {/* Interactive Request Builder */}
      <div className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Progress Dots */}
          <div className="flex justify-center gap-3 mb-12">
            {["describe", "budget", "timeline"].map((s, i) => (
              <motion.div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  step === s
                    ? "w-16 bg-gradient-to-r from-blue-500 to-brand-green-light"
                    : "w-2 bg-gray-700"
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          {/* Main Card */}
          <motion.div
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 md:p-12 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {step === "describe" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-3xl font-bold mb-3">What do you need?</h2>
                <p className="text-gray-400 mb-8">
                  Be specific. The clearer you are, the better the results.
                </p>

                {/* Examples for Inspiration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: Bot, text: "Robot manipulation in cluttered environments" },
                    { icon: Car, text: "Autonomous vehicle edge cases" },
                    { icon: Hand, text: "Human-robot collaboration scenarios" },
                    { icon: Factory, text: "Industrial sensor calibration data" },
                  ].map((example) => (
                    <button
                      key={example.text}
                      onClick={() => setDescription(example.text)}
                      className="text-left p-4 bg-gray-900/50 hover:bg-gray-900 border border-gray-700 hover:border-blue-500/50 rounded-xl transition-all group flex items-center gap-3"
                    >
                      <example.icon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 flex-shrink-0" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">
                        {example.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Input */}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your data requirements in detail..."
                  className="w-full h-40 bg-gray-900/50 border border-gray-700 focus:border-blue-500 rounded-xl p-4 text-white placeholder-gray-500 transition-all outline-none resize-none"
                />

                <motion.button
                  onClick={() => setStep("budget")}
                  disabled={!description}
                  className="mt-6 w-full py-4 bg-gradient-to-r from-blue-500 to-brand-green-light hover:from-blue-600 hover:to-brand-green-strong disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed"
                  whileHover={{ scale: description ? 1.02 : 1 }}
                  whileTap={{ scale: description ? 0.98 : 1 }}
                >
                  {description ? "Continue →" : "Type something to continue"}
                </motion.button>
              </motion.div>
            )}

            {step === "budget" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button
                  onClick={() => setStep("describe")}
                  className="mb-6 text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>

                <h2 className="text-3xl font-bold mb-3">What's your budget?</h2>
                <p className="text-gray-400 mb-8">
                  We'll match you with collectors in your range.
                </p>

                {/* Budget Presets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Starter", value: "500", desc: "< 100 samples" },
                    { label: "Growth", value: "2000", desc: "100-1K samples" },
                    { label: "Scale", value: "10000", desc: "1K-10K samples" },
                    { label: "Enterprise", value: "50000", desc: "10K+ samples" },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setBudget(preset.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        budget === preset.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="text-lg font-bold text-white">${preset.label}</div>
                      <div className="text-sm text-gray-400">{preset.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-gray-900/50 border border-gray-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-4 text-2xl text-white placeholder-gray-600 transition-all outline-none"
                  />
                </div>

                <motion.button
                  onClick={() => setStep("timeline")}
                  disabled={!budget}
                  className="mt-6 w-full py-4 bg-gradient-to-r from-blue-500 to-brand-green-light hover:from-blue-600 hover:to-brand-green-strong disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-white transition-all disabled:cursor-not-allowed"
                  whileHover={{ scale: budget ? 1.02 : 1 }}
                  whileTap={{ scale: budget ? 0.98 : 1 }}
                >
                  {budget ? "Continue →" : "Enter a budget to continue"}
                </motion.button>
              </motion.div>
            )}

            {step === "timeline" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-brand-green-light rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h2 className="text-3xl font-bold mb-3">Almost there!</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  This feature is launching soon. We're building the matching algorithm to connect
                  you with the perfect collectors.
                </p>

                {/* Preview Summary */}
                <div className="bg-gray-900/50 rounded-xl p-6 mb-8 text-left">
                  <div className="text-sm text-gray-500 mb-2">Your Request</div>
                  <div className="text-white mb-4 leading-relaxed">{description}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Budget</span>
                    <span className="text-2xl font-bold text-green-400">${budget}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep("describe");
                    setDescription("");
                    setBudget("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Start over
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Trust Signals */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "lock",
                title: "Verified Collectors",
                desc: "Every collector is hardware-verified and SP1-proven",
              },
              {
                icon: "zap",
                title: "Fast Turnaround",
                desc: "Get proposals in hours, data in days",
              },
              {
                icon: "star",
                title: "Quality Guaranteed",
                desc: "AI-verified authenticity on every sample",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                className="text-center p-6 bg-gray-800/30 rounded-2xl border border-gray-700/50"
                whileHover={{ y: -5 }}
              >
                <div className="flex justify-center mb-3">
                  {item.icon === "lock" && <Lock className="w-10 h-10 text-blue-400" />}
                  {item.icon === "zap" && <Zap className="w-10 h-10 text-yellow-400" />}
                  {item.icon === "star" && <Star className="w-10 h-10 text-brand-green-light" />}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
