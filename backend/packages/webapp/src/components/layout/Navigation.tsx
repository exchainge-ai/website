"use client";

/**
 * TODO: Future Enhancements for Navigation:
 * 1. Implement role-based navigation items
 * 2. Add notifications system with badge counters
 * 3. Implement breadcrumbs for better navigation
 * 4. Add search functionality in the navigation bar
 * 5. Support for multi-language with internationalization (i18n)
 * 6. Add theme switching capability (dark/light mode)
 * 7. Implement guided tours for new users
 */

import { usePrivy } from "@privy-io/react-auth";
import { Menu, X, User, Settings, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Main navigation component
 * Displays different navigation items based on authentication status and current path
 */
export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Define the type for navigation links
  type NavLink = {
    href: string;
    label: string;
    isRouterLink?: boolean;
    ariaLabel?: string;
  };

  // Simple, focused navigation - best UX practice
  const mainLinks: NavLink[] = [
    {
      href: "/marketplace",
      label: "Marketplace",
      isRouterLink: true,
      ariaLabel: "Browse and bid on datasets",
    },
    {
      href: "/discovery",
      label: "Discovery",
      isRouterLink: true,
      ariaLabel: "Explore upcoming datasets and data requests",
    },
    {
      href: "/docs",
      label: "Docs",
      isRouterLink: true,
      ariaLabel: "Documentation and API reference",
    },
    {
      href: "/how-it-works",
      label: "How It Works",
      isRouterLink: true,
      ariaLabel: "Learn how it works",
    },
    {
      href: "/about",
      label: "About",
      isRouterLink: true,
      ariaLabel: "About ExchAInge",
    },
  ];

  // Handle click outside to close mobile menu and profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
      if (
        profileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, profileDropdownOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Detect scrolling for styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [mobileMenuOpen]);

  // Use same navigation everywhere for consistency (best UX practice)
  const navLinks = mainLinks;

  // Close mobile menu on navigation
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  // Handle authentication actions with proper error handling
  const handleLogin = useCallback(async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
      // You could add a notification/toast here in a real app
    }
  }, [login]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // You could add a notification/toast here in a real app
    }
  }, [logout]);

  return (
    <nav
      className={`fixed top-0 w-full bg-gray-900/90 backdrop-blur-md border-b border-gray-700 z-50 transition-all duration-300 ${
        isScrolled ? "shadow-lg" : ""
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" aria-label="ExchAInge - Go to homepage" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ExchAInge
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) =>
              link.isRouterLink ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-gray-300 hover:text-white transition-colors ${
                    pathname === link.href ? "text-white font-medium" : ""
                  }`}
                  aria-label={link.ariaLabel || link.label}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label={link.ariaLabel || link.label}
                >
                  {link.label}
                </a>
              ),
            )}

            {/* User Dashboard Link - Only show when authenticated */}
            {ready && authenticated && (
              <Link
                href="/dashboard"
                className={`text-purple-400 hover:text-purple-300 transition-colors ${
                  pathname?.startsWith("/dashboard") ? "font-medium" : ""
                }`}
                aria-label="Go to your dashboard"
                aria-current={
                  pathname?.startsWith("/dashboard") ? "page" : undefined
                }
              >
                Dashboard
              </Link>
            )}

            {/* Auth Buttons */}
            {ready ? (
              authenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    aria-label="Open profile menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {user?.email?.address || user?.wallet?.address?.slice(0, 6) || "Account"}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm text-gray-400">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">
                          {user?.email?.address || user?.wallet?.address}
                        </p>
                      </div>

                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </button>
              )
            ) : (
              // Loading state
              <div
                className="w-20 h-8 bg-gray-700 rounded-lg animate-pulse"
                aria-label="Loading authentication status"
              ></div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-white hover:bg-gray-800"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">
                {mobileMenuOpen ? "Close menu" : "Open menu"}
              </span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
        id="mobile-menu"
        ref={mobileMenuRef}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900 border-t border-gray-800">
          {navLinks.map((link) =>
            link.isRouterLink ? (
              <Link
                key={`mobile-${link.href}`}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={closeMobileMenu}
                aria-label={link.ariaLabel || link.label}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={`mobile-${link.href}`}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={closeMobileMenu}
                aria-label={link.ariaLabel || link.label}
              >
                {link.label}
              </a>
            ),
          )}

          {/* User Dashboard Link - Only show when authenticated */}
          {ready && authenticated && (
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-purple-400 hover:bg-gray-800 hover:text-purple-300"
              onClick={closeMobileMenu}
              aria-label="Go to your dashboard"
              aria-current={
                pathname?.startsWith("/dashboard") ? "page" : undefined
              }
            >
              Dashboard
            </Link>
          )}

          {/* Auth Button - Mobile */}
          {ready && (
            <div className="px-3 py-3 border-t border-gray-800 mt-2">
              {authenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
                  aria-label="Sign out of your account"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleLogin();
                    closeMobileMenu();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-base font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
