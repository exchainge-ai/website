"use client";

import { CheckCircle, X } from "lucide-react";
import { useState } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "terms" | "privacy">(
    "summary",
  );
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    setAccepted(true);
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[80vh] flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors z-10"
          type="button"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-1">
            Exchainge Terms of Service
          </h2>
          <p className="text-gray-400 text-sm">
            Please review the terms before uploading
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "summary"
                ? "border-brand-green-light text-brand-green-light"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
            type="button"
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "terms"
                ? "border-brand-green-light text-brand-green-light"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
            type="button"
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "privacy"
                ? "border-brand-green-light text-brand-green-light"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
            type="button"
          >
            Privacy Policy
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === "summary" && (
            <div>
              <p className="text-gray-300 mb-4">
                For your convenience, we have summarized the most important
                terms:
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>You retain ownership</strong> - Uploaded datasets
                    remain your property
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Your data is private</strong> unless you choose to
                    share it on the marketplace
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>We don't sell your data</strong> - We only
                    facilitate transactions you authorize
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Ownership required</strong> - You must be the
                    original owner OR hold resale rights that allow modification
                    and/or resale
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Follow acceptable use</strong> - No illegal or
                    harmful content
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Earn revenue automatically</strong> - Tokenized
                    licenses route payments to you
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Usage tracking for attribution</strong> - We log
                    dataset usage for audit
                  </span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-6 text-gray-300">
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  1. Dataset Ownership
                </h3>
                <p>
                  When you upload a dataset to Exchainge, you retain full
                  ownership of your data. We do not claim any ownership rights
                  to your datasets.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  2. Licensing & Revenue
                </h3>
                <p className="mb-2">
                  By listing a dataset, you authorize Exchainge to issue
                  tokenized licenses encoding usage scope, revenue splits, and
                  attribution requirements.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  3. Data Quality & Verification
                </h3>
                <p>
                  All datasets undergo AI verification to ensure quality,
                  metadata accuracy, and compliance with privacy regulations.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  4. Intellectual Property & Ownership
                </h3>
                <p>
                  You must be either: (1) the original owner of the dataset, OR
                  (2) hold explicit resale rights that permit modification
                  and/or resale of the dataset. You warrant that uploading and
                  licensing this dataset does not infringe on any third-party
                  intellectual property rights.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  5. Platform Fees
                </h3>
                <p>
                  Exchainge charges a transaction fee on each dataset sale. All
                  fees are disclosed before listing.
                </p>
              </section>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6 text-gray-300">
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Information We Collect
                </h3>
                <p>
                  Account info (email, wallet), dataset metadata, usage data,
                  and technical logs for platform operation.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How We Use Your Information
                </h3>
                <p>
                  To operate the marketplace, process transactions, verify
                  quality, provide support, and track usage for attribution.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Data Security
                </h3>
                <p>
                  Datasets stored encrypted, TLS for transfers, access
                  controlled via tokenized licenses, regular security audits.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Your Rights
                </h3>
                <p>
                  Access, correct, delete, export, or restrict processing of
                  your data. Contact privacy@exchainge.ai to exercise rights.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-600 text-brand-green-light focus:ring-brand-green-light cursor-pointer"
            />
            <span className="text-sm text-gray-300">
              I accept the Terms of Service and Privacy Policy. I confirm that I
              am either the original owner of this dataset OR hold explicit
              resale rights that permit modification and/or resale.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className="flex-1 px-4 py-3 bg-brand-green-light hover:bg-brand-green-strong disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
