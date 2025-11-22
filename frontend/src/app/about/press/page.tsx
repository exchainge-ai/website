export default function PressPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Press & Media</h1>
        <p className="text-xl text-gray-300 mb-12">
          Latest news and announcements from ExchAInge
        </p>

        <div className="space-y-8">
          <article className="bg-gray-800 border border-gray-700 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-brand-green" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  <a href="https://x.com/exchaingeai/status/1975941011495907555" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-green-strong transition-colors">
                    ExchAInge on Twitter/X
                  </a>
                </h2>
                <p className="text-gray-400 text-sm mb-4">Follow us for the latest updates</p>
                <p className="text-gray-300">
                  Stay up to date with product launches, partnerships, and industry insights.
                </p>
              </div>
            </div>
          </article>

          <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
            <p className="text-gray-300 mb-4">
              For press inquiries, interviews, or media kits, please contact:
            </p>
            <a href="mailto:marketing@exchainge.net" className="inline-flex items-center text-brand-green hover:text-brand-green-strong font-semibold">
              marketing@exchainge.net
            </a>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">About ExchAInge</h2>
            <p className="text-gray-300 leading-relaxed">
              ExchAInge is a decentralized marketplace for physical AI datasets. We connect data creators with AI developers, enabling secure monetization of robotics and sensor data through blockchain-verified licenses. Our platform ensures data authenticity through AI verification while providing instant payments and transparent ownership.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
