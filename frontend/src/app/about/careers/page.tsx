export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Careers</h1>
        <p className="text-xl text-gray-300 mb-12">
          Join us in building the future of physical AI data
        </p>

        <div className="space-y-8">
          <section className="bg-gray-800 border border-gray-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Why ExchAInge?</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We're creating the infrastructure that will power the next generation of physical AI applications—from autonomous robots to smart cities.
              </p>
              <p>
                Our team brings together expertise in AI, robotics, blockchain, and data markets. We're backed by leading investors and working with pioneering hardware companies.
              </p>
            </div>
          </section>

          <section className="bg-gray-800 border border-gray-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">What We're Looking For</h2>
            <ul className="space-y-3 text-gray-300">
              <li>• Full-stack engineers with blockchain or AI experience</li>
              <li>• AI/ML engineers specializing in data quality and verification</li>
              <li>• Business development professionals with data marketplace experience</li>
              <li>• Developer relations and community builders</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Open Positions</h2>
            <p className="text-gray-300 mb-6">
              We're always looking for exceptional talent. If you're passionate about AI, robotics, or data markets, we'd love to hear from you.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">How to Apply</h3>
                <p className="text-gray-300 mb-4">
                  Send your resume, portfolio, and a brief note about why you're interested in ExchAInge to:
                </p>
                <a
                  href="mailto:marketing@exchainge.net?subject=Career Opportunity"
                  className="inline-flex items-center bg-brand-green text-primary-foreground px-6 py-3 rounded-lg hover:bg-brand-green-strong transition-colors font-semibold"
                >
                  marketing@exchainge.net
                </a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-2 text-brand-green">Innovation First</h3>
                <p className="text-gray-300 text-sm">
                  We're building something that doesn't exist yet. We value creative problem-solving and bold ideas.
                </p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-2 text-brand-green">Transparency</h3>
                <p className="text-gray-300 text-sm">
                  Open communication and honest feedback. We believe in blockchain's promise of transparency.
                </p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-2 text-brand-green">Impact</h3>
                <p className="text-gray-300 text-sm">
                  We're enabling the next wave of AI applications. Your work will directly shape the industry.
                </p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-2 text-brand-green">Ownership</h3>
                <p className="text-gray-300 text-sm">
                  Take ownership of your projects. We trust our team to make decisions and move fast.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
