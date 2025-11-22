export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-gray-800"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block mb-4">
              ExchAInge
            </span>
            <p className="text-gray-400 font-medium">
              The premier marketplace for specialized datasets powering physical AI applications.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">Browse Datasets</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">List Your Data</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">API Access</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">Research Papers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors font-medium">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400 font-medium">&copy; {new Date().getFullYear()} ExchAInge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
