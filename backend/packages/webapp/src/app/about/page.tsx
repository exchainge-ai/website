"use client";

import { motion } from "framer-motion";
import { CheckCircle, Diamond, DollarSign, Settings } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Hero - The Mission */}
      <div className="relative overflow-hidden">
        {/* Gradient Orb Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-32">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="inline-block mb-6 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-blue-400 text-sm font-semibold">OUR MISSION</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                Building the foundation for
                <br />
                Physical AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
              AI learned to think from text. Now it needs to learn to{" "}
              <span className="text-white font-semibold">move, touch, and navigate</span> the real
              world.
              <br />
              <br />
              We're building the marketplace that makes it possible.
            </p>
          </motion.div>
        </div>
      </div>

      {/* The Problem */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-3">
                THE PROBLEM
              </h2>
              <h3 className="text-4xl font-bold text-white mb-6">
                Physical AI is starving for real data
              </h3>
              <div className="space-y-4 text-gray-400">
                <p className="leading-relaxed">
                  Today's robots are trained on synthetic data—perfect simulations that don't
                  capture the messy, unpredictable real world.
                </p>
                <p className="leading-relaxed">
                  <span className="text-white">The result?</span> Robots that work in labs but fail
                  in factories. Self-driving cars that struggle in the rain. Humanoids that can't
                  pick up a glass.
                </p>
                <p className="leading-relaxed">
                  Physical AI needs <span className="text-white font-semibold">real sensors</span>,{" "}
                  <span className="text-white font-semibold">real physics</span>,{" "}
                  <span className="text-white font-semibold">real environments</span>.
                </p>
              </div>
            </div>

            <div className="relative">
              <motion.div
                className="aspect-square rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 p-8 flex items-center justify-center"
                whileHover={{ rotate: 2, scale: 1.05 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">99%</div>
                  <div className="text-gray-400">of robot training data is synthetic</div>
                  <p className="text-sm text-red-400 mt-4">This is the core problem we solve</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* The Solution */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="md:order-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-3">
                THE SOLUTION
              </h2>
              <h3 className="text-4xl font-bold text-white mb-6">
                A marketplace for verified, real-world data
              </h3>
              <div className="space-y-4 text-gray-400">
                <p className="leading-relaxed">
                  We created the first marketplace where physical AI datasets are{" "}
                  <span className="text-white font-semibold">cryptographically verified</span> to
                  come from real hardware.
                </p>
                <p className="leading-relaxed">
                  Using <span className="text-white">zero-knowledge proofs</span> and{" "}
                  <span className="text-white">physics-based AI detection</span>, we guarantee every
                  byte is authentic.
                </p>
                <p className="leading-relaxed">
                  Collectors earn. Developers get real data. Physical AI finally works.
                </p>
              </div>
            </div>

            <div className="md:order-1 relative">
              <motion.div
                className="aspect-square rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 p-8 flex items-center justify-center"
                whileHover={{ rotate: -2, scale: 1.05 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">100%</div>
                  <div className="text-gray-400">verified authenticity</div>
                  <p className="text-sm text-green-400 mt-4">Powered by cryptographic proofs</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Core Principles */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What we believe
            </h2>
            <p className="text-xl text-gray-400">The principles that guide everything we build</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: CheckCircle,
                color: "blue",
                title: "Authenticity First",
                desc: "No synthetic data. No simulations. Only real-world captures from real hardware.",
              },
              {
                icon: Diamond,
                color: "green",
                title: "Open Marketplace",
                desc: "Anyone can collect. Anyone can buy. Decentralized, permissionless, global.",
              },
              {
                icon: DollarSign,
                color: "purple",
                title: "Collectors Earn",
                desc: "Data creators get paid fairly. Royalties flow automatically. Forever.",
              },
              {
                icon: Settings,
                color: "yellow",
                title: "Instant Verification",
                desc: "No manual review. No gatekeepers. AI + ZK proofs verify in seconds.",
              },
            ].map((principle, i) => (
              <motion.div
                key={principle.title}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className={`w-12 h-12 rounded-lg bg-${principle.color}-600/20 text-${principle.color}-400 flex items-center justify-center mb-4`}>
                  <principle.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{principle.title}</h3>
                <p className="text-gray-400 leading-relaxed">{principle.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* The Team Vision */}
      <div className="container mx-auto px-4 py-24">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-12 md:p-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500" />
              </div>
            </div>

            <blockquote className="text-2xl md:text-3xl text-white font-medium mb-8 leading-relaxed text-center">
              "We're not building another dataset marketplace.
              <br />
              We're building the <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">data layer for Physical AI</span>."
            </blockquote>

            <div className="text-center">
              <div className="text-gray-400 mb-2">The ExchAInge Team</div>
              <div className="text-sm text-gray-500">Building the future of embodied AI</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Join the Movement */}
      <div className="container mx-auto px-4 pb-24">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Join the movement
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Whether you're a data collector, AI researcher, or robotics company—
            <br />
            there's a place for you in the Physical AI revolution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/marketplace"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Datasets
            </motion.a>
            <motion.a
              href="/dashboard/upload"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Collecting
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
