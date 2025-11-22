'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Code, Zap, Users, ArrowRight } from 'lucide-react';

export default function DocsComingSoon() {
  const router = useRouter();

  const docSections = [
    {
      icon: BookOpen,
      title: 'API Documentation',
      description: 'Complete REST API reference with authentication, endpoints, and error handling.',
      comingDate: 'November 2025',
    },
    {
      icon: Code,
      title: 'Integration Guides',
      description: 'Step-by-step guides for TensorFlow, PyTorch, Hugging Face, and custom ML pipelines.',
      comingDate: 'November 2025',
    },
    {
      icon: Zap,
      title: 'Quick Start',
      description: 'Get up and running in 5 minutes with code examples and sample datasets.',
      comingDate: 'November 2025',
    },
    {
      icon: Users,
      title: 'Community & Support',
      description: 'FAQs, troubleshooting guides, and links to Discord, email support, and resources.',
      comingDate: 'December 2025',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-brand-green-light rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Documentation
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Comprehensive guides, API reference, and integration examples coming soon
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-20 text-center">
            <div className="inline-block mb-6">
              <div className="w-20 h-20 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-600/30">
                <BookOpen className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need to Know
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              We're building comprehensive documentation to help you integrate, build, and scale with physical AI data. Documentation launches alongside our full platform release.
            </p>
            <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 inline-block">
              <p className="text-amber-200">
                <strong>Note:</strong> Sign up below to get early access when docs launch
              </p>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {docSections.map((section) => (
              <div
                key={section.title}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-gray-600 hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-900/50 transition-colors">
                  <section.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
                <p className="text-gray-400 mb-4">{section.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <span className="text-sm text-blue-400 font-medium">
                    Coming {section.comingDate}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* What's Included */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 mb-16">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">What's Included in Full Docs</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">REST API Reference</h4>
                    <p className="text-sm text-gray-400">All endpoints, parameters, authentication, and response formats</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Code Examples</h4>
                    <p className="text-sm text-gray-400">Python, TypeScript, cURL, and language-specific SDKs</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Data Format Specs</h4>
                    <p className="text-sm text-gray-400">Accepted file formats, schemas, and validation rules</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Integration Guides</h4>
                    <p className="text-sm text-gray-400">TensorFlow, PyTorch, Hugging Face, and ML frameworks</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">FAQ & Troubleshooting</h4>
                    <p className="text-sm text-gray-400">Common issues, best practices, and optimization tips</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Support Resources</h4>
                    <p className="text-sm text-gray-400">Discord community, email support, and office hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">Documentation Roadmap</h3>
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-400 ring-4 ring-blue-400/30"></div>
                  <div className="w-1 h-24 bg-gradient-to-b from-blue-400 to-gray-700 mt-2"></div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">November 2025</h4>
                  <p className="text-gray-400">API Reference, Quick Start Guide, and Integration Examples</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                  <div className="w-1 h-24 bg-gray-700 mt-2"></div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">December 2025</h4>
                  <p className="text-gray-400">Advanced Integration Guides, Video Tutorials, and Community Resources</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">January 2026</h4>
                  <p className="text-gray-400">SDKs, CLI Tools, and Advanced Features Documentation</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600/10 to-brand-green-light/10 backdrop-blur-sm border border-blue-600/30 rounded-xl p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Get Early Access
            </h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Be the first to know when our comprehensive documentation launches. Sign up to receive updates and early access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 hover:border-gray-600 transition-colors"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Notify Me
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              We'll send you updates and early access links. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 border-t border-gray-700 bg-gray-800/30 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            In the meantime, explore our platform
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Browse Marketplace
            </button>
            <button
              onClick={() => router.push('/discovery')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Explore Discovery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
