"use client";

import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export function TermsContent() {
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
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-gray-400 mt-1">Last updated: October 2024</p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-brand-green-strong/20 border border-brand-green-light/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-brand-green-light" />
            Summary
          </h2>
          <p className="text-gray-300 mb-4">
            For your convenience, we have summarized the most important terms:
          </p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>You retain ownership</strong> - Uploaded datasets remain
                your property
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Your data is private</strong> unless you choose to share
                it on the marketplace
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>We don't sell your data</strong> - We only facilitate
                transactions you authorize
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Don't infringe copyrights</strong> - Only upload data
                you have rights to
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Follow acceptable use</strong> - No illegal or harmful
                content
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Earn revenue automatically</strong> - Tokenized licenses
                route payments to you
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Usage tracking for attribution</strong> - We log dataset
                usage for audit and compliance
              </span>
            </li>
          </ul>
        </div>

        {/* Main Terms */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Dataset Ownership
            </h2>
            <p className="text-gray-300 mb-3">
              When you upload a dataset to Exchainge, you retain full ownership
              of your data. We do not claim any ownership rights to your
              datasets.
            </p>
            <p className="text-gray-300">
              You grant us a limited license to host, display, and distribute
              your dataset only as necessary to provide the marketplace service
              and fulfill authorized transactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Licensing & Revenue
            </h2>
            <p className="text-gray-300 mb-3">
              By listing a dataset on our marketplace, you authorize Exchainge
              to issue tokenized licenses on your behalf. Each license encodes:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Usage scope (time, geography, use case, seats)</li>
              <li>Revenue split terms for collaborators</li>
              <li>Access level and restrictions</li>
              <li>Attribution requirements</li>
            </ul>
            <p className="text-gray-300 mt-3">
              You earn recurring revenue based on actual usage, tracked
              automatically through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. Data Quality & Verification
            </h2>
            <p className="text-gray-300 mb-3">
              All uploaded datasets undergo AI verification to ensure quality,
              metadata accuracy, and compliance. Datasets must:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                Include accurate metadata (sensor types, calibration, etc.)
              </li>
              <li>Meet minimum quality standards</li>
              <li>Not contain malicious or corrupted files</li>
              <li>Comply with privacy and data protection regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Privacy & Compliance
            </h2>
            <p className="text-gray-300">
              You are responsible for ensuring your dataset complies with all
              applicable privacy laws (GDPR, CCPA, etc.). Sensitive fields
              should be masked or aggregated before upload. We provide tools to
              help with privacy-preserving processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-gray-300 mb-3">
              You represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>You have the right to upload and license the dataset</li>
              <li>
                The dataset does not infringe on third-party intellectual
                property
              </li>
              <li>
                You have obtained necessary permissions from data subjects and
                collaborators
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-gray-300 mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Upload illegal, harmful, or offensive content</li>
              <li>Use the platform for fraudulent purposes</li>
              <li>Attempt to circumvent security or verification systems</li>
              <li>Misrepresent dataset quality, source, or licensing terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Platform Fees</h2>
            <p className="text-gray-300">
              Exchainge charges a transaction fee on each dataset sale. Premium
              access plans and API usage may incur additional fees. All fees are
              disclosed before you list a dataset.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Termination & Removal
            </h2>
            <p className="text-gray-300">
              We reserve the right to remove datasets or terminate accounts that
              violate these terms. You may remove your datasets at any time,
              subject to existing license commitments to buyers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Liability & Warranties
            </h2>
            <p className="text-gray-300">
              The platform is provided "as is" without warranties. We are not
              liable for dataset quality, buyer disputes, or indirect damages.
              Your liability is limited to fees paid in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <p className="text-gray-300">
              For questions about these terms, contact us at{" "}
              <a
                href="mailto:legal@exchainge.ai"
                className="text-brand-green-light hover:text-green-300"
              >
                legal@exchainge.ai
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/marketplace"
            className="inline-block bg-brand-green-light hover:bg-brand-green-strong text-white px-8 py-3 rounded-xl font-semibold transition-all"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
