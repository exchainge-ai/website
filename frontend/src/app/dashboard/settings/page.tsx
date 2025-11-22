"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  User,
  Wallet,
  CreditCard,
  Bell,
  Shield,
  Download,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const { user, authenticated, ready, logout, exportWallet, createWallet } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showPrivateKeyWarning, setShowPrivateKeyWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "wallet" | "billing" | "notifications">("account");
  const [creatingWallet, setCreatingWallet] = useState(false);

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-green-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    router.push("/");
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleExportWallet = async () => {
    try {
      await exportWallet();
    } catch (error) {
      console.error("Failed to export wallet:", error);
    }
  };

  const handleCreateSolanaWallet = async () => {
    setCreatingWallet(true);
    try {
      await createWallet();
      console.log("[Settings] Solana wallet created successfully!");
    } catch (error) {
      console.error("Failed to create Solana wallet:", error);
    } finally {
      setCreatingWallet(false);
    }
  };

  // Wallets use 'type' property, not 'chainType'
  // Filter to only show Privy embedded wallets (not external wallets like MetaMask)
  const solanaWallets = wallets.filter((w: any) => w.type === "solana" && w.walletClientType === "privy");
  const ethereumWallets = wallets.filter((w: any) => w.type === "ethereum" && w.walletClientType === "privy");

  // Get the first one of each type
  const solanaWallet = solanaWallets[0];
  const ethereumWallet = ethereumWallets[0];

  // Debug
  console.log("[Settings] All wallets:", wallets);
  console.log("[Settings] Solana wallets (embedded):", solanaWallets);
  console.log("[Settings] Ethereum wallets (embedded):", ethereumWallets);
  console.log("[Settings] Using Solana:", solanaWallet);
  console.log("[Settings] Using Ethereum:", ethereumWallet);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account, wallet, and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-gray-800 rounded-xl border border-gray-700 p-2">
              <button
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "account"
                    ? "bg-brand-green-light text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Account</span>
              </button>

              <button
                onClick={() => setActiveTab("wallet")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "wallet"
                    ? "bg-brand-green-light text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span className="font-medium">Wallet</span>
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "billing"
                    ? "bg-brand-green-light text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Billing</span>
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "notifications"
                    ? "bg-brand-green-light text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="font-medium">Notifications</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Account Information</h2>

                <div className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Email</label>
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <p className="text-white">{user?.email?.address || "No email connected"}</p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">User ID</label>
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                      <p className="text-white font-mono text-sm truncate">{user?.id}</p>
                      <button
                        onClick={() => copyToClipboard(user?.id || "")}
                        className="ml-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedAddress ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Member Since</label>
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <p className="text-white">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={() => logout()}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === "wallet" && (
              <div className="space-y-6">
                {/* Security Warning */}
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-yellow-400 font-semibold mb-1">Security Warning</h3>
                    <p className="text-yellow-300/80 text-sm">
                      Never share your private keys with anyone. ExchAInge will never ask for your private keys.
                      Store them securely offline.
                    </p>
                  </div>
                </div>

                {/* Solana Wallet */}
                {solanaWallet && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-green-light to-cyan-500 rounded-full flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Solana Wallet</h3>
                          <p className="text-sm text-gray-400">For dataset payments & blockchain proof</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                          <p className="text-white font-mono text-sm truncate">{solanaWallet.address}</p>
                          <button
                            onClick={() => copyToClipboard(solanaWallet.address)}
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedAddress ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowPrivateKeyWarning(true)}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Private Key
                      </button>
                    </div>
                  </div>
                )}

                {/* Ethereum Wallet */}
                {ethereumWallet && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Ethereum Wallet</h3>
                          <p className="text-sm text-gray-400">For EVM-compatible payments</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                          <p className="text-white font-mono text-sm truncate">{ethereumWallet.address}</p>
                          <button
                            onClick={() => copyToClipboard(ethereumWallet.address)}
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedAddress ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowPrivateKeyWarning(true)}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Private Key
                      </button>
                    </div>
                  </div>
                )}

                {/* Create Solana Wallet if missing */}
                {!solanaWallet && ethereumWallet && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-green-light/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-brand-green-light" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Solana Wallet Not Found</h3>
                    <p className="text-gray-400 mb-6">Create a Solana wallet for blockchain proofs and payments</p>
                    <button
                      onClick={handleCreateSolanaWallet}
                      disabled={creatingWallet}
                      className="bg-gradient-to-r from-brand-green-light to-cyan-500 hover:from-brand-green-strong hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                    >
                      {creatingWallet ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Wallet...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" />
                          Create Solana Wallet
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* No wallets at all */}
                {!solanaWallet && !ethereumWallet && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
                    <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Wallets Found</h3>
                    <p className="text-gray-400 mb-4">Embedded wallets are created automatically on login</p>
                  </div>
                )}
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Billing & Payments</h2>

                <div className="space-y-6">
                  {/* Current Plan */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Current Plan</label>
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Free Tier</p>
                          <p className="text-sm text-gray-400">Upload up to 10 datasets</p>
                        </div>
                        <button className="bg-brand-green-light hover:bg-brand-green-strong text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Upgrade
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Payment Methods</label>
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 text-center">
                      <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 mb-4">No payment methods added</p>
                      <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Add Payment Method
                      </button>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Recent Transactions</label>
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 text-center">
                      <p className="text-gray-400">No transactions yet</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { label: "Dataset purchases", description: "Get notified when someone purchases your dataset" },
                    { label: "Verification updates", description: "Updates on dataset verification status" },
                    { label: "New data requests", description: "Alerts for new data requests in your categories" },
                    { label: "Marketing emails", description: "Product updates and feature announcements" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={idx < 2} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green-light"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Private Key Warning Modal */}
        {showPrivateKeyWarning && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl border-2 border-red-500 p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Critical Security Warning</h3>
              </div>

              <div className="space-y-3 mb-6 text-gray-300">
                <p className="font-semibold text-red-400">WARNING: NEVER share your private key with anyone.</p>
                <ul className="space-y-2 text-sm">
                  <li>• Anyone with your private key can steal all your funds</li>
                  <li>• ExchAInge will NEVER ask for your private key</li>
                  <li>• Store it offline in a secure location</li>
                  <li>• Do not screenshot or save it digitally</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleExportWallet();
                    setShowPrivateKeyWarning(false);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  I Understand - Export Private Key
                </button>
                <button
                  onClick={() => setShowPrivateKeyWarning(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
