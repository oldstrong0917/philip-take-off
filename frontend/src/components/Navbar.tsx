"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
         style={{ backgroundColor: 'rgba(253, 247, 230, 0.85)', borderColor: 'rgba(245, 166, 125, 0.2)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl md:text-2xl tracking-wider"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}
          >
            憶。老爸
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="transition-colors text-sm"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}
            >
              首頁
            </Link>
            <Link
              href="/messages"
              className="transition-colors text-sm"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}
            >
              所有留言
            </Link>
            <Link
              href="/condolence"
              className="transition-colors text-sm"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}
            >
              留下祝福
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            style={{ color: 'var(--color-text-dark)' }}
            aria-label="開啟選單"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm transition-colors"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}
            >
              首頁
            </Link>
            <Link
              href="/messages"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm transition-colors"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}
            >
              所有留言
            </Link>
            <Link
              href="/condolence"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm transition-colors"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}
            >
              留下祝福
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
