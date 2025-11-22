export default function ForBuyersPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">For Buyers</h1>
        <p className="text-xl text-gray-300 mb-12">
          Find verified physical AI datasets. Download instantly and start training better models.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">How to Purchase</h2>
            <ol className="space-y-4 list-decimal list-inside text-gray-300">
              <li>Browse datasets by category, sensor type, or search</li>
              <li>Preview samples and quality scores</li>
              <li>Purchase with crypto (instant access)</li>
              <li>Download via API or direct link</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">Purchase Options</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2 text-white">One-Time Purchase</h3>
                <p className="text-gray-300 text-sm">Buy a license and own it forever. Use commercially without restrictions.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2 text-white">API Access</h3>
                <p className="text-gray-300 text-sm">Subscribe monthly for live data feeds. Perfect for continuous training.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">What's Available</h2>
            <ul className="space-y-2 text-gray-300">
              <li>• Navigation data from warehouse robots</li>
              <li>• Drone flight telemetry and sensor logs</li>
              <li>• Multi-modal biometric data</li>
              <li>• Time-series IoT sensor data</li>
              <li>• LiDAR, camera, and radar datasets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">Quality Assurance</h2>
            <p className="text-gray-300 mb-4">
              Every dataset includes:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li>• AI quality score and verification badge</li>
              <li>• Blockchain provenance and audit logs</li>
              <li>• Preview samples before purchase</li>
              <li>• Clear usage rights and licensing terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-brand-green">Integration</h2>
            <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm text-brand-green border border-gray-700">
              <code>{`# Download via Python SDK
from exchainge import DatasetClient

client = DatasetClient(api_key="your-key")
dataset = client.download("dataset-id")

# Load into PyTorch
loader = DataLoader(dataset.to_torch())`}</code>
            </div>
          </section>

          <div className="pt-8">
            <a
              href="/marketplace"
              className="inline-flex items-center bg-brand-green text-primary-foreground px-8 py-4 rounded-lg hover:bg-brand-green-strong transition-colors font-semibold text-lg"
            >
              Browse Marketplace
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
