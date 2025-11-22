"use client";

import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Globe,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  OptimizedHero,
  PriorityHeading,
  PriorityText,
} from "@/components/optimized/PriorityComponents";

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const teamMembers = [
    {
      name: "Marc Ryan",
      role: "Co-Founder & CEO",
      expertise: "Blockchain Development",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcRyan",
    },
    {
      name: "Luca Trevisani",
      role: "Co-Founder & CSO",
      expertise: "Crypto-Native Strategy",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=LucaTrevisani",
    },
    {
      name: "Milind Choudhary",
      role: "CTO & Head of AI",
      expertise: "AI & Robotics Research",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=MilindChoudhary",
    },
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll);

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
      window.removeEventListener("scroll", handleScroll);
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

  const nextTeamMember = () => {
    if (isTransitioning || currentTeamIndex >= teamMembers.length - 3) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentTeamIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 150);
  };

  const prevTeamMember = () => {
    if (isTransitioning || currentTeamIndex <= 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentTeamIndex((prev) => prev - 1);
      setIsTransitioning(false);
    }, 150);
  };

  const getVisibleMembers = () => {
    const members = [];
    for (let i = 0; i < 3; i++) {
      const index = currentTeamIndex + i;
      if (index < teamMembers.length) {
        members.push(teamMembers[index]);
      }
    }
    return members;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent"></div>
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
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed min-h-[6rem]"
              priority={true}
            >
              Build better AI with real-world robotics data you can trust.
              Collect from your hardware, earn from your data, and help advance
              the future of AI together.
            </PriorityText>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={launchMarketplace}
                type="button"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Explore Datasets
              </button>
              <button
                type="button"
                className="border border-gray-600 text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-500 hover:bg-gray-800 transition-all duration-300"
              >
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">5,000+</div>
                <div className="text-gray-400">Datasets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">25K+</div>
                <div className="text-gray-400">Researchers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500K+</div>
                <div className="text-gray-400">Downloads</div>
              </div>
            </div>
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
                color: "purple",
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
                  <div className="text-3xl font-bold text-blue-400 mb-2">
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
                    <Check className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={launchMarketplace}
                type="button"
                className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Explore Datasets
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-600 overflow-hidden">
              <div className="w-full h-48 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-lg mb-4 flex items-center justify-center">
                <Database className="w-16 h-16 text-blue-400" />
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
                    <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center h-64">
                <div className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 w-full h-full flex items-center justify-center">
                  <Brain className="w-20 h-20 text-purple-400" />
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
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real examples of the high-quality datasets available in our marketplace. Used by leading AI researchers and companies.
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
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
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
                    <div className="font-semibold text-green-400">{dataset.quality}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Downloads</div>
                    <div className="font-semibold text-blue-400">{dataset.downloads}</div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                  <span className="font-medium">by</span> {dataset.creator}
                </p>
                
                <button
                  type="button"
                  onClick={launchMarketplace}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all inline-flex items-center justify-center group/btn"
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
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Explore All Datasets
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Team Carousel Section */}
      <section
        id="about"
        data-animate
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/90 backdrop-blur-sm relative z-10"
      >
        <div
          className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible.about ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built by a Team You Can Trust
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experienced builders in AI, robotics, and blockchain working to make data collection simple and profitable.
            </p>
          </div>

          {/* Team Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={prevTeamMember}
                className={`absolute left-0 z-10 bg-gray-700/80 hover:bg-gray-600/80 shadow-lg rounded-full p-2 transition-all duration-300 backdrop-blur-sm ${
                  currentTeamIndex <= 0
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
                disabled={isTransitioning || currentTeamIndex <= 0}
              >
                <ChevronLeft className="w-6 h-6 text-gray-300" />
              </button>

              <div className="overflow-hidden mx-16">
                <div
                  className={`grid md:grid-cols-3 gap-8 transition-all duration-300 ease-in-out transform ${
                    isTransitioning
                      ? "opacity-0 translate-x-4"
                      : "opacity-100 translate-x-0"
                  }`}
                >
                  {getVisibleMembers().map((member, index) => (
                    <div
                      key={`${member.name}-${currentTeamIndex}-${index}`}
                      className="bg-gray-700/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 text-center border border-gray-600"
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                      />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {member.name}
                      </h3>
                      <p className="text-blue-400 font-medium mb-2">
                        {member.role}
                      </p>
                      <p className="text-gray-300 text-sm">
                        {member.expertise}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={nextTeamMember}
                className={`absolute right-0 z-10 bg-gray-700/80 hover:bg-gray-600/80 shadow-lg rounded-full p-2 transition-all duration-300 backdrop-blur-sm ${
                  currentTeamIndex >= teamMembers.length - 3
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
                disabled={
                  isTransitioning || currentTeamIndex >= teamMembers.length - 3
                }
              >
                <ChevronRight className="w-6 h-6 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join the community of data collectors and AI builders making real progress.
          </p>
          <button
            onClick={launchMarketplace}
            type="button"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
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
                  "70% revenue share on sales",
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
                <p className="text-3xl font-bold text-blue-400 mb-1">
                  {tier.price}
                </p>
                <p className="text-gray-400 mb-6">{tier.description}</p>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-300">
                      <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources & Support Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/90 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to Get Started
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Complete documentation, integration guides, and dedicated support for engineers and teams.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            {[
              {
                icon: Database,
                title: "API Documentation",
                description: "REST APIs, webhooks, and SDKs. Get started in minutes.",
                color: "blue",
              },
              {
                icon: Brain,
                title: "Integration Guides",
                description: "TensorFlow, PyTorch, Hugging Face. Ready-to-use examples.",
                color: "purple",
              },
              {
                icon: Cpu,
                title: "Code Examples",
                description: "Python, JavaScript, Go samples. Copy-paste ready.",
                color: "cyan",
              },
              {
                icon: Rocket,
                title: "Support Center",
                description: "FAQ, guides, and community forum. 24/7 availability.",
                color: "green",
              },
            ].map((resource) => (
              <a
                key={resource.title}
                href="#"
                className="bg-gray-700/50 backdrop-blur-sm p-6 rounded-xl border border-gray-600 hover:border-blue-500/50 transition-all group cursor-pointer"
              >
                <div
                  className={`w-10 h-10 bg-${resource.color}-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-${resource.color}-800 transition-all`}
                >
                  <resource.icon className={`w-5 h-5 text-${resource.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-gray-400 text-sm">{resource.description}</p>
              </a>
            ))}
          </div>

          {/* Quick Integration Examples */}
          <div className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 backdrop-blur-sm border border-gray-600 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Integration Example</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
              <pre>{`# Download a dataset with Python
from marketplace_sdk import DatasetClient

client = DatasetClient(api_key="your-api-key")
dataset = client.download("mobile-robot-navigation-v1")

# Load into PyTorch
import torch
from torch.utils.data import DataLoader

train_loader = DataLoader(
  dataset.to_torch_dataset(),
  batch_size=32
)`}</pre>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              See our full <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold">integration guide</a> for TensorFlow, Hugging Face, and more.
            </p>
          </div>
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
                    <useCase.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{useCase.title}</h3>
                </div>
                <ul className="space-y-3">
                  {useCase.applications.map((app) => (
                    <li key={app} className="flex items-start">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-8 rounded-xl border border-blue-500/30 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                Have a specific use case in mind?
              </h3>
              <p className="text-gray-300 mb-6">
                Our team can help you find exactly the datasets you need or work with collectors to create custom data.
              </p>
              <button
                type="button"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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
