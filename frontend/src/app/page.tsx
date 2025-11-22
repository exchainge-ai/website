"use client";

import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  Cpu,
  Database,
  Globe,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  OptimizedHero,
  PriorityHeading,
  PriorityText,
} from "@/components/optimized/PriorityComponents";

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        }
      },
      { threshold: 0.1 },
    );

    const sections = document.querySelectorAll("[data-animate]");
    for (const section of sections) {
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToNext = () => {
    const nextSection = document.getElementById("features");
    nextSection?.scrollIntoView({ behavior: "smooth" });
  };

  const launchMarketplace = () => {
    router.push("/marketplace");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-950 text-white">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900/80 to-gray-900/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-green/20 via-transparent to-transparent" />
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_top,_rgba(31,185,196,0.2),transparent_70%)] blur-3xl" />
      </div>

      {/* Hero Section - Optimized for faster LCP */}
      <OptimizedHero className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <PriorityHeading
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              id="hero-main-heading"
              priority={true}
            >
              <span className="text-white block">
                Own Your Physical AI Data
              </span>
            </PriorityHeading>
            <PriorityText
              id="hero-main-text"
              className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
              priority={true}
            >
              The marketplace for verified physical AI datasets. Monetize your robotics data or find exactly what you need to train better models.
            </PriorityText>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={launchMarketplace}
                type="button"
                className="rounded-xl bg-brand-green px-8 py-4 text-lg font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-green-strong hover:shadow-[0_28px_60px_-28px_rgba(99,247,125,0.85)]"
              >
                Explore Datasets
              </button>
              <button
                type="button"
                className="rounded-xl border border-gray-700/70 px-8 py-4 text-lg font-semibold text-gray-200 transition-all duration-300 hover:bg-white/10 hover:text-white"
              >
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">5,000+</div>
                <div className="text-gray-400 text-sm">Datasets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">25K+</div>
                <div className="text-gray-400 text-sm">Researchers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500K+</div>
                <div className="text-gray-400 text-sm">Downloads</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-6 italic">* Projected marketplace capacity</p>
          </div>
        </div>

        <div className="text-center mt-16">
          <button
            onClick={scrollToNext}
            type="button"
            className="text-gray-400 hover:text-gray-300 transition-colors animate-bounce"
          >
            <ChevronDown size={32} />
          </button>
        </div>
      </OptimizedHero>

      {/* Features Section */}
      <section
        id="features"
        data-animate
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/90 backdrop-blur-sm relative z-10"
      >
        <div
          className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose This Platform
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Whether you're collecting data or buying it, we make it simple and transparent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "Real Data, Verified",
                description:
                  "Every dataset is checked to ensure it comes from real hardware. No synthetic shortcuts, no faked data.",
                color: "blue",
              },
              {
                icon: Shield,
                title: "Easy & Transparent",
                description:
                  "Simple upload process, clear pricing, no hidden fees. Know exactly what you're getting before you buy.",
                color: "green",
              },
              {
                icon: Zap,
                title: "Get Paid Fast",
                description:
                  "Earnings appear in your wallet instantly. Withdraw anytime, no waiting periods or complications.",
                color: "cyan",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="bg-gray-700/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-600"
              >
                <div
                  className={`w-12 h-12 bg-${feature.color}-900 rounded-lg flex items-center justify-center mb-6`}
                >
                  <feature.icon
                    className={`w-6 h-6 text-${feature.color}-400`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Data Quality Guarantees Section */}
          <div className="mt-20 bg-gradient-to-r from-gray-700/50 to-gray-800/50 backdrop-blur-sm p-12 rounded-2xl border border-gray-600">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              Our Data Quality Standards
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  metric: "100%",
                  label: "Hardware Verified",
                  description: "All data sources confirmed authentic",
                },
                {
                  metric: "AI-Powered",
                  label: "Verification",
                  description: "Automated AI checks ensure quality",
                },
                {
                  metric: "Always Live",
                  label: "Publishing",
                  description: "Go live after verification—quality score shown",
                },
                {
                  metric: "Zero",
                  label: "Hidden Fees",
                  description: "Complete pricing transparency",
                },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl font-bold text-brand-green mb-2">
                    {item.metric}
                  </div>
                  <div className="font-semibold text-white mb-1">{item.label}</div>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section
        id="solutions"
        data-animate
        className="py-20 px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div
          className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible.solutions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              For Data Collectors and AI Builders
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Different needs, same platform. Whether you're selling data or buying it, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">
                For Data Collectors
              </h3>
              <div className="space-y-4">
                {[
                  "Upload your robotics data in minutes",
                  "Get verified and go live instantly",
                  "Earn money every time your data is used",
                  "Track your earnings in real-time",
                ].map((benefit, index) => (
                  <div key={benefit} className="flex items-center">
                    <Check className="w-5 h-5 text-brand-green mr-3" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={launchMarketplace}
                type="button"
                className="mt-8 bg-brand-green text-primary-foreground px-6 py-3 rounded-lg hover:bg-brand-green-strong transition-colors inline-flex items-center font-semibold"
              >
                Explore Datasets
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-600 overflow-hidden">
              <div className="w-full h-48 bg-gradient-to-br from-brand-green/20 to-gray-900/40 rounded-lg mb-4 flex items-center justify-center">
                <Database className="w-16 h-16 text-brand-green" />
              </div>
              <p className="text-sm text-gray-300">Real robotics hardware and sensor data from physical systems</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              For AI Researchers & Companies
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Find the data you need to train better models, faster.
            </p>
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div className="space-y-3">
                {[
                  "Browse thousands of verified datasets",
                  "Download immediately and start training",
                  "Support the researchers who collected the data",
                ].map((benefit, index) => (
                  <div key={benefit} className="flex items-center">
                    <Check className="w-5 h-5 text-brand-green mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center h-64">
                <div className="bg-gradient-to-br from-brand-green/20 to-gray-900/40 w-full h-full flex items-center justify-center">
                  <Brain className="w-20 h-20 text-brand-green" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Datasets Section */}
      <section
        id="featured"
        data-animate
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 relative z-10"
      >
        <div
          className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible.featured ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Featured Datasets
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              Example datasets showing the types of data available on our platform.
            </p>
            <p className="text-sm text-gray-400 italic">
              * Examples shown are for demonstration purposes only
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Mobile Robot Navigation",
                description: "Real-world robot navigation data from warehouse environments",
                datapoints: "2.5M frames",
                category: "Robotics",
                quality: 98,
                downloads: "1,200+",
                creator: "Automation Research Lab",
              },
              {
                title: "Drone Flight Telemetry",
                description: "High-frequency sensor data from autonomous drone flights",
                datapoints: "500K points",
                category: "Autonomous Systems",
                quality: 96,
                downloads: "850+",
                creator: "Aerial Tech Institute",
              },
              {
                title: "Biometric Sensor Suite",
                description: "Multi-modal biometric data from embedded sensors",
                datapoints: "1.8M readings",
                category: "Sensors",
                quality: 99,
                downloads: "650+",
                creator: "Bio-Tech Research Group",
              },
            ].map((dataset) => (
              <div
                key={dataset.title}
                className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20 group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="inline-block bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                      {dataset.category}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors">
                      {dataset.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-400 mb-4">{dataset.description}</p>
                
                <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-700">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Data Points</div>
                    <div className="font-semibold text-white">{dataset.datapoints}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Quality</div>
                    <div className="font-semibold text-brand-green">{dataset.quality}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Downloads</div>
                    <div className="font-semibold text-brand-green">{dataset.downloads}</div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                  <span className="font-medium">by</span> {dataset.creator}
                </p>
                
                <button
                  type="button"
                  onClick={launchMarketplace}
                  className="w-full bg-brand-green hover:bg-brand-green-strong text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-all inline-flex items-center justify-center group/btn"
                >
                  View Dataset
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">
              These are just a few examples. Browse our full marketplace for thousands more datasets.
            </p>
            <button
              onClick={launchMarketplace}
              type="button"
              className="inline-flex items-center bg-brand-green text-primary-foreground px-6 py-3 rounded-lg hover:bg-brand-green-strong transition-colors font-semibold"
            >
              Explore All Datasets
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-brand-green/90 to-brand-green-strong/90 backdrop-blur-sm relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-gray-900">
            Join the community of data collectors and AI builders making real progress.
          </p>
          <button
            onClick={launchMarketplace}
            type="button"
            className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Pricing & Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              No hidden fees. Know exactly what you'll earn or spend.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "For Data Collectors",
                price: "0%",
                description: "No upfront costs",
                features: [
                  "Free dataset uploads",
                  "95% revenue share on sales",
                  "Instant payments",
                  "No listing fees",
                ],
              },
              {
                title: "For Researchers",
                price: "Varies",
                description: "Pay per dataset",
                features: [
                  "One-time purchase or license",
                  "Instant download access",
                  "Commercial license options",
                  "API access available",
                ],
              },
              {
                title: "For Companies",
                price: "Custom",
                description: "Volume discounts",
                features: [
                  "Bulk dataset licensing",
                  "Team management",
                  "Custom contracts",
                  "Dedicated support",
                ],
              },
            ].map((tier) => (
              <div
                key={tier.title}
                className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all"
              >
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.title}
                </h3>
                <p className="text-3xl font-bold text-brand-green mb-1">
                  {tier.price}
                </p>
                <p className="text-gray-400 mb-6">{tier.description}</p>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-300">
                      <Check className="w-4 h-4 text-brand-green mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Paths Section */}
      <section className="relative z-10 bg-gray-800/90 py-20 px-4 sm:px-6 lg:px-8 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              Built for AI teams at every stage
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-300">
              Choose the track that matches your goals—whether you&apos;re sourcing production data, validating research, or shipping features fast.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "AI Companies",
                icon: Rocket,
                description: "Secure a custom pipeline of robotics and sensor data with clear licensing.",
                bullets: [
                  "Private data rooms with enterprise access controls",
                  "Dedicated sourcing support for fleet deployments",
                  "Compliance-ready audit trails for every asset",
                ],
                ctaLabel: "Talk to us",
                ctaHref: "/request",
              },
              {
                title: "Research Labs",
                icon: Brain,
                description: "Access curated field data for experimentation and publication.",
                bullets: [
                  "Verified capture from partner hardware programs",
                  "Usage analytics for citations and reproducibility",
                  "Flexible licensing for academic collaborations",
                ],
                ctaLabel: "Explore marketplace",
                ctaHref: "/marketplace",
              },
              {
                title: "Engineers & Builders",
                icon: Cpu,
                description: "Integrate physical AI data into products with a single SDK.",
                bullets: [
                  "REST and streaming endpoints with rapid auth",
                  "Sandbox datasets for prototyping and demos",
                  "Python, TypeScript, and Rust starter kits",
                ],
                ctaLabel: "Read the docs",
                ctaHref: "/docs",
              },
            ].map((persona) => (
              <div
                key={persona.title}
                className="flex flex-col gap-4 rounded-2xl border border-gray-700 bg-gray-800/60 p-6 transition-all hover:border-brand-green/50"
              >
                <div className="flex items-center gap-3">
                  <persona.icon className="h-6 w-6 text-brand-green" />
                  <h3 className="text-xl font-semibold text-white">{persona.title}</h3>
                </div>
                <p className="text-sm text-gray-300">{persona.description}</p>
                <ul className="flex-1 space-y-2 text-sm text-gray-400">
                  {persona.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-brand-green" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={persona.ctaHref}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-[#03241f] transition-all hover:-translate-y-0.5 hover:bg-brand-green-strong"
                >
                  {persona.ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Want the full breakdown? Dive into our{" "}
            <Link href="/docs" className="font-semibold text-brand-green hover:text-brand-green-light">
              documentation hub
            </Link>{" "}
            or{" "}
            <Link href="/request" className="font-semibold text-brand-green hover:text-brand-green-light">
              schedule a strategy call
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Use Cases & Applications Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Real-World Applications
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See how researchers and companies are using our data to build better AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Robotics & Autonomous Systems",
                applications: [
                  "Train navigation models for warehouse robots",
                  "Improve object detection in dynamic environments",
                  "Develop robust grasping algorithms",
                  "Test collision avoidance in real conditions",
                ],
                icon: Rocket,
              },
              {
                title: "Computer Vision",
                applications: [
                  "Build better edge detection models",
                  "Train multi-camera perception systems",
                  "Improve semantic segmentation accuracy",
                  "Develop real-time tracking algorithms",
                ],
                icon: Brain,
              },
              {
                title: "Reinforcement Learning",
                applications: [
                  "Train RL policies with real-world trajectories",
                  "Reduce sim-to-real gap in robotics",
                  "Develop better reward functions",
                  "Validate learning algorithms at scale",
                ],
                icon: Cpu,
              },
              {
                title: "Time-Series Analysis",
                applications: [
                  "Build predictive maintenance models",
                  "Improve sensor anomaly detection",
                  "Train forecasting algorithms",
                  "Develop early warning systems",
                ],
                icon: Database,
              },
            ].map((useCase) => (
              <div
                key={useCase.title}
                className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                    <useCase.icon className="w-6 h-6 text-brand-green" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{useCase.title}</h3>
                </div>
                <ul className="space-y-3">
                  {useCase.applications.map((app) => (
                    <li key={app} className="flex items-start">
                      <Check className="w-5 h-5 text-brand-green mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-brand-green/20 to-brand-green-strong/20 backdrop-blur-sm p-8 rounded-xl border border-brand-green/30 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                Have a specific use case in mind?
              </h3>
              <p className="text-gray-300 mb-6">
                Our team can help you find exactly the datasets you need or work with collectors to create custom data.
              </p>
              <button
                type="button"
                className="inline-flex items-center bg-brand-green text-primary-foreground px-6 py-3 rounded-lg hover:bg-brand-green-strong transition-colors font-semibold"
              >
                Contact Our Team
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
