"use client";

interface NewsletterSectionProps {
  email: string;
  onEmailChange: (value: string) => void;
  isSubscribed: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const NewsletterSection = ({
  email,
  onEmailChange,
  isSubscribed,
  onSubmit,
}: NewsletterSectionProps) => {
  return (
    <div className="bg-gray-800 py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 via-gray-900/50 to-gray-800/50"></div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Stay Updated
        </h2>
        <p className="text-xl text-gray-300 mb-8 font-medium">
          Get the latest updates on new datasets and platform features
        </p>

        {isSubscribed ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 text-green-400">
            <h3 className="text-xl font-semibold mb-2">
              Thank you for subscribing!
            </h3>
            <p>You'll receive updates about new datasets and features.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewsletterSection;
