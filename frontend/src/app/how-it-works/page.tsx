"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Camera, CheckCircle, Rocket, TrendingUp, Shield, BarChart3, CreditCard } from "lucide-react";

export default function HowItWorksPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const steps = [
    {
      phase: "Collect",
      title: "Start with What You Have",
      description:
        "Use the robotics hardware you already own. Just connect it, follow our simple setup guide, and start collecting real data.",
      icon: "camera",
      details: [
        "Works with existing hardware",
        "Step-by-step setup guides",
        "Automatic data validation",
        "No technical expertise needed",
      ],
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      phase: "Verify",
      title: "We Verify It's Real",
      description:
        "We check every piece of data to make sure it comes from real hardware, not simulations. Your buyers can trust what they're getting.",
      icon: "check",
      details: [
        "Automatic authenticity checks",
        "Quality scoring",
        "Transparent verification process",
        "Built-in trust from day one",
      ],
      gradient: "from-brand-green-light to-pink-500",
    },
    {
      phase: "List",
      title: "List and Go Live",
      description: "Set your price and describe your data. We handle the rest—you go live instantly, no waiting for approvals.",
      icon: "rocket",
      details: [
        "Instant publishing",
        "Flexible pricing options",
        "Easy licensing setup",
        "Preview samples included",
      ],
      gradient: "from-green-500 to-emerald-500",
    },
    {
      phase: "Earn",
      title: "Get Paid for Your Data",
      description:
        "Every download, every license renewal. Your earnings arrive directly to your wallet, whenever you want to withdraw.",
      icon: "trending-up",
      details: [
        "Direct payments",
        "Transparent tracking",
        "Withdraw anytime",
        "See earnings in real-time",
      ],
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div ref={containerRef} className="bg-gray-900">
      {/* Hero with Parallax */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <motion.div
          className="relative z-10 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="text-white">
              How It Works
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Four simple steps to start earning from your robotics data.
            <br />
            <span className="text-white font-semibold">No complexity. Just real data, real earnings.</span>
          </p>

          <motion.div
            className="mt-12"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg
              className="w-6 h-6 mx-auto text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Step-by-Step Journey */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto space-y-32">
          {steps.map((step, index) => (
            <motion.div
              key={step.phase}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 -bottom-32 w-0.5 h-32 bg-gradient-to-b from-gray-700 to-transparent hidden md:block" />
              )}

              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Left Side - Visual */}
                <motion.div
                  className={`relative ${index % 2 === 0 ? "md:order-1" : "md:order-2"}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div
                    className={`aspect-square rounded-3xl bg-gradient-to-br ${step.gradient} p-1`}
                  >
                    <div className="w-full h-full bg-gray-900 rounded-3xl flex items-center justify-center">
                      {step.icon === "camera" && <Camera className="w-24 h-24 text-white" />}
                      {step.icon === "check" && <CheckCircle className="w-24 h-24 text-white" />}
                      {step.icon === "rocket" && <Rocket className="w-24 h-24 text-white" />}
                      {step.icon === "trending-up" && <TrendingUp className="w-24 h-24 text-white" />}
                    </div>
                  </div>

                  {/* Floating Phase Badge */}
                  <motion.div
                    className="absolute -top-4 -left-4 bg-gray-800 border border-gray-700 rounded-full px-4 py-2"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-sm font-semibold text-gray-400">
                      STEP {index + 1}
                    </span>
                  </motion.div>
                </motion.div>

                {/* Right Side - Content */}
                <div className={index % 2 === 0 ? "md:order-2" : "md:order-1"}>
                  <h3
                    className={`text-sm font-bold uppercase tracking-wider mb-3 bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}
                  >
                    {step.phase}
                  </h3>

                  <h2 className="text-4xl font-bold text-white mb-4">{step.title}</h2>

                  <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Feature List */}
                  <ul className="space-y-3">
                    {step.details.map((detail) => (
                      <motion.li
                        key={detail}
                        className="flex items-start gap-3 group"
                        whileHover={{ x: 10 }}
                      >
                        <div
                          className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.gradient}`}
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">
                          {detail}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Why Buyers Trust This Data */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built on Trust
            </h2>
            <p className="text-xl text-gray-400">
              Here's how we ensure every dataset is legitimate
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Verified Hardware",
                desc: "We confirm data comes from real devices—no simulated datasets, no shortcuts.",
                icon: Shield,
                color: "green",
              },
              {
                title: "Quality Checks",
                desc: "Automated testing catches issues before your data goes live, protecting your reputation.",
                icon: BarChart3,
                color: "blue",
              },
              {
                title: "Transparent Pricing",
                desc: "No hidden fees. You see exactly what you'll earn before you upload anything.",
                icon: CreditCard,
                color: "green",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all"
                whileHover={{ y: -10 }}
              >
                <div className={`w-16 h-16 rounded-xl bg-${item.color}-500/20 flex items-center justify-center mb-4`}>
                  <item.icon className={`w-8 h-8 text-${item.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <motion.div
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-500/10 to-brand-green-light/10 border border-blue-500/20 rounded-3xl p-12"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to start earning?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join the marketplace where physical AI datasets actually matter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/marketplace"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-brand-green-light hover:from-blue-600 hover:to-brand-green-strong rounded-xl font-semibold text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Datasets
            </motion.a>
            <motion.a
              href="/dashboard/upload"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Upload Data
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
