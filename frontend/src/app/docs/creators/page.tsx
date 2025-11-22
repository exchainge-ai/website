export default function ForCreatorsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">For Data Creators</h1>
        <p className="text-xl text-gray-300 mb-12">
          Monetize your robotics and AI data. Upload in minutes, earn on every sale.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">How to Get Started</h2>
            <ol className="space-y-4 list-decimal list-inside text-gray-300">
              <li>Upload your dataset (any sensor type, format, or size)</li>
              <li>Set your price (fixed price, auction, or private sale)</li>
              <li>Get AI-verified automatically</li>
              <li>Go live and start earning 95% on every sale</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">What You Can Upload</h2>
            <ul className="space-y-2 text-gray-300">
              <li>• Robotics navigation and movement data</li>
              <li>• Drone telemetry and flight logs</li>
              <li>• Sensor data (LiDAR, cameras, IMU, GPS)</li>
              <li>• Time-series data from embedded systems</li>
              <li>• Any physical AI application data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">Revenue Share</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <p className="text-3xl font-bold text-brand-green mb-2">95%</p>
              <p className="text-gray-300">You keep 95% of every sale. Payments sent instantly to your wallet.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">Quality Standards</h2>
            <p className="text-gray-300 mb-4">
              All datasets go through automated AI verification to ensure:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li>• Authentic hardware origin (no synthetic data)</li>
              <li>• Complete metadata and documentation</li>
              <li>• Proper formatting and accessibility</li>
              <li>• Privacy compliance</li>
            </ul>
          </section>

          <div className="pt-8">
            <a
              href="/dashboard/upload"
              className="inline-flex items-center bg-brand-green text-primary-foreground px-8 py-4 rounded-lg hover:bg-brand-green-strong transition-colors font-semibold text-lg"
            >
              Start Uploading Data
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
