"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Menu, X, User, Settings, LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  ariaLabel?: string;
};

type NavDropdown = {
  label: string;
  items: NavLink[];
};

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const learnDropdownRef = useRef<HTMLDivElement>(null);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);

  const mainLinks: NavLink[] = [
    {
      href: "/marketplace",
      label: "Marketplace",
      ariaLabel: "Browse datasets with filters and categories",
    },
    {
      href: "/discovery",
      label: "Discovery",
      ariaLabel: "Explore trending datasets and featured creators",
    },
  ];

  const learnDropdown: NavDropdown = {
    label: "Learn",
    items: [
      { href: "/how-it-works", label: "How It Works", ariaLabel: "End-to-end guide from upload to resale" },
      { href: "/docs", label: "Documentation", ariaLabel: "Developer integration and Solana specs" },
      { href: "/docs/creators", label: "For Data Creators", ariaLabel: "Best practices for uploading data" },
      { href: "/docs/buyers", label: "For Buyers", ariaLabel: "Licensing and resale rules" },
    ],
  };

  const aboutDropdown: NavDropdown = {
    label: "About",
    items: [
      { href: "/about", label: "Mission", ariaLabel: "Our mission and vision" },
      { href: "/about/team", label: "Team", ariaLabel: "Meet the team" },
      { href: "/about/press", label: "Press", ariaLabel: "Press and media" },
      { href: "/about/careers", label: "Careers", ariaLabel: "Join our team" },
    ],
  };

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
      if (
        learnDropdownOpen &&
        learnDropdownRef.current &&
        !learnDropdownRef.current.contains(event.target as Node)
      ) {
        setLearnDropdownOpen(false);
      }
      if (
        aboutDropdownOpen &&
        aboutDropdownRef.current &&
        !aboutDropdownRef.current.contains(event.target as Node)
      ) {
        setAboutDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, profileDropdownOpen, learnDropdownOpen, aboutDropdownOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setLearnDropdownOpen(false);
        setAboutDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleLogin = useCallback(async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, [login]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout]);

  return (
    <nav
      className={`fixed top-0 w-full border-b border-gray-800 bg-gray-950/90 backdrop-blur-xl z-50 transition-all duration-300 ${
        isScrolled ? "shadow-[0_30px_80px_-35px_rgba(99,247,125,0.45)]" : ""
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              aria-label="ExchAInge - Go to homepage"
              className="group flex items-center gap-2.5 transition-all"
            >
              <Image
                src="/Profile.png"
                alt="ExchAInge logo"
                width={36}
                height={36}
                priority
                className="h-9 w-9"
              />
              <span className="text-2xl font-bold text-white tracking-tight">
                exch<span className="text-[#6DF77E]">ai</span>nge
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-brand-green text-[#03241f] shadow-[0_18px_40px_-18px_rgba(99,247,125,0.65)]"
                    : "text-gray-200 hover:text-white hover:bg-white/10"
                }`}
                aria-label={link.ariaLabel || link.label}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}

            {ready && authenticated && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname?.startsWith("/dashboard")
                    ? "bg-brand-green text-[#03241f] shadow-[0_18px_40px_-18px_rgba(99,247,125,0.65)]"
                    : "text-gray-200 hover:text-white hover:bg-white/10"
                }`}
                aria-label="Your dashboard"
                aria-current={pathname?.startsWith("/dashboard") ? "page" : undefined}
              >
                Dashboard
              </Link>
            )}

            {/* Learn Dropdown */}
            <div className="relative" ref={learnDropdownRef}>
              <button
                type="button"
                onClick={() => setLearnDropdownOpen(!learnDropdownOpen)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-all"
                aria-expanded={learnDropdownOpen}
              >
                {learnDropdown.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${learnDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {learnDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-800 bg-gray-900/95 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl z-50">
                  {learnDropdown.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                      onClick={() => setLearnDropdownOpen(false)}
                      aria-label={item.ariaLabel || item.label}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* About Dropdown */}
            <div className="relative" ref={aboutDropdownRef}>
              <button
                type="button"
                onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-all"
                aria-expanded={aboutDropdownOpen}
              >
                {aboutDropdown.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${aboutDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {aboutDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-800 bg-gray-900/95 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl z-50">
                  {aboutDropdown.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                      onClick={() => setAboutDropdownOpen(false)}
                      aria-label={item.ariaLabel || item.label}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {ready ? (
              authenticated ? (
                <div className="relative ml-2" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white transition-colors bg-white/5 hover:bg-white/10"
                    aria-label="Open profile menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-green/90 flex items-center justify-center text-[#03241f] shadow-[0_16px_36px_-20px_rgba(99,247,125,0.8)]">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium hidden lg:block">
                      {user?.email?.address?.split('@')[0] || user?.wallet?.address?.slice(0, 6) || "Account"}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-800 bg-gray-900/95 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl z-50">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate mt-1">
                          {user?.email?.address || user?.wallet?.address}
                        </p>
                      </div>

                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors"
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
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
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
                  className="ml-2 rounded-xl bg-brand-green px-5 py-2 text-sm font-semibold text-[#03241f] transition-all hover:-translate-y-0.5 hover:bg-brand-green-strong hover:shadow-[0_18px_40px_-18px_rgba(99,247,125,0.75)]"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </button>
              )
            ) : (
              <div className="ml-2 h-8 w-20 animate-pulse rounded-xl bg-gray-800/80" aria-label="Loading authentication status"></div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white hover:bg-white/10"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
        id="mobile-menu"
        ref={mobileMenuRef}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-800 bg-gray-950/95 backdrop-blur-xl">
          {mainLinks.map((link) => (
            <Link
              key={`mobile-${link.href}`}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === link.href
                  ? "bg-brand-green text-[#03241f]"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}
              onClick={closeMobileMenu}
              aria-label={link.ariaLabel || link.label}
            >
              {link.label}
            </Link>
          ))}

          {ready && authenticated && (
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith("/dashboard")
                  ? "bg-brand-green text-[#03241f]"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>
          )}

          {/* Learn Section */}
          <div className="pt-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Learn</p>
            {learnDropdown.items.map((item) => (
              <Link
                key={`mobile-learn-${item.href}`}
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm text-gray-200 hover:bg-white/10 hover:text-white"
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* About Section */}
          <div className="pt-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">About</p>
            {aboutDropdown.items.map((item) => (
              <Link
                key={`mobile-about-${item.href}`}
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm text-gray-200 hover:bg-white/10 hover:text-white"
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
          </div>

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
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-red-700 transition-colors"
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
                  className="w-full bg-[#6DF77E] text-[#0C2B31] px-4 py-2 rounded-lg text-base font-semibold hover:bg-[#04C61B] transition-all shadow-lg"
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
