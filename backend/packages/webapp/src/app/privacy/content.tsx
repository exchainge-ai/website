"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export function PrivacyContent() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/marketplace"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-gray-400 mt-1">Last updated: October 2024</p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Privacy Summary
          </h2>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong>Your privacy is important to us.</strong> Here's how we
              handle your data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                We collect only what's necessary to operate the marketplace
              </li>
              <li>
                Your uploaded datasets are encrypted and access-controlled
              </li>
              <li>We never sell your personal information to third parties</li>
              <li>You control who can access your datasets</li>
              <li>We track usage for billing and attribution only</li>
              <li>You can delete your account and data at any time</li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Information We Collect
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                <strong>Account Information:</strong> Email, wallet address,
                authentication credentials (via Privy)
              </p>
              <p>
                <strong>Dataset Metadata:</strong> Title, description, category,
                tags, pricing, and technical specifications
              </p>
              <p>
                <strong>Usage Data:</strong> Downloads, views, purchases, and
                licensing transactions
              </p>
              <p>
                <strong>Payment Information:</strong> Transaction history,
                revenue, and payout details (processed through secure payment
                providers)
              </p>
              <p>
                <strong>Technical Data:</strong> IP address, browser type,
                device info, and access logs
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>To operate and improve the marketplace platform</li>
              <li>To process transactions and distribute revenue</li>
              <li>To verify dataset quality and compliance</li>
              <li>To provide customer support</li>
              <li>To prevent fraud and ensure security</li>
              <li>To track usage for attribution and audit purposes</li>
              <li>
                To send important updates about your account (with opt-out for
                marketing)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. Data Storage & Security
            </h2>
            <p className="text-gray-300 mb-3">We take security seriously:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                Datasets are stored encrypted in secure cloud storage (Supabase)
              </li>
              <li>Access is controlled via tokenized licenses</li>
              <li>All data transfers use TLS encryption</li>
              <li>We perform regular security audits</li>
              <li>Employee access is logged and restricted</li>
              <li>Backups are encrypted and stored securely</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
            <p className="text-gray-300 mb-3">
              We share your data only in these limited cases:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                <strong>With buyers:</strong> Only authorized dataset access
                based on purchased licenses
              </li>
              <li>
                <strong>Service providers:</strong> Cloud hosting (Supabase),
                authentication (Privy), payments (secure processors)
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law or to
                protect rights and safety
              </li>
              <li>
                <strong>Business transfers:</strong> In case of merger or
                acquisition (with notice)
              </li>
            </ul>
            <p className="text-gray-300 mt-3">
              <strong>We never sell your personal information.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Your Privacy Rights
            </h2>
            <p className="text-gray-300 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Delete your account and associated
                data
              </li>
              <li>
                <strong>Export:</strong> Download your datasets and metadata
              </li>
              <li>
                <strong>Restrict:</strong> Limit how we process your data
              </li>
              <li>
                <strong>Object:</strong> Opt out of certain data processing
              </li>
              <li>
                <strong>Portability:</strong> Transfer data to another service
              </li>
            </ul>
            <p className="text-gray-300 mt-3">
              Contact{" "}
              <a
                href="mailto:privacy@exchainge.ai"
                className="text-blue-400 hover:text-blue-300"
              >
                privacy@exchainge.ai
              </a>{" "}
              to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. Cookies & Tracking
            </h2>
            <p className="text-gray-300 mb-3">We use cookies to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze site usage (optional analytics)</li>
            </ul>
            <p className="text-gray-300 mt-3">
              You can disable cookies in your browser settings, but some
              features may not work.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-gray-300">
              We retain your data as long as your account is active. After
              deletion:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-3">
              <li>
                Account data is deleted within 30 days (except where legally
                required)
              </li>
              <li>
                Transaction records are kept for 7 years for tax/audit purposes
              </li>
              <li>
                Datasets are removed from marketplace but existing licenses
                remain valid
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. International Data Transfers
            </h2>
            <p className="text-gray-300">
              Your data may be processed in countries outside your residence. We
              ensure appropriate safeguards (like standard contractual clauses)
              are in place for international transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-gray-300">
              Our service is not intended for users under 18. We do not
              knowingly collect data from children. If you believe a child has
              provided data, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-300">
              We may update this policy periodically. We'll notify you of
              significant changes via email or platform notice. Continued use
              after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-gray-300">
              Questions about privacy? Contact us at:
            </p>
            <p className="text-gray-300 mt-2">
              Email:{" "}
              <a
                href="mailto:privacy@exchainge.ai"
                className="text-blue-400 hover:text-blue-300"
              >
                privacy@exchainge.ai
              </a>
            </p>
            <p className="text-gray-300">
              For GDPR/CCPA requests:{" "}
              <a
                href="mailto:dpo@exchainge.ai"
                className="text-blue-400 hover:text-blue-300"
              >
                dpo@exchainge.ai
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/marketplace"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
