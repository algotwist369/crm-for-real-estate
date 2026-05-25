import React from "react";
import { Link } from "react-router-dom";

const CookiesPolicyPage = () => (
  <div className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold text-white">Cookie Policy</h1>
        <p className="text-sm text-zinc-400">
          This page explains how AlgoTwist CRM uses cookies and similar technologies to provide a secure, consistent experience.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. What Are Cookies?</h2>
          <p className="text-sm text-zinc-400 leading-7">
            Cookies are small text files placed on your device to remember preferences, authentication status, and tracking information. They help the CRM keep you signed in and maintain session state.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Types of Cookies We Use</h2>
          <ul className="list-disc ml-5 text-sm text-zinc-400 leading-7">
            <li><strong>Essential:</strong> Required for authentication, security, and basic functionality.</li>
            <li><strong>Preferences:</strong> Remember UI preferences and display settings.</li>
            <li><strong>Analytics:</strong> Aggregated usage data to improve the product (non-identifying by default).</li>
            <li><strong>Third-Party:</strong> Cookies set by connected services (e.g., social platforms, analytics providers).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Cookies & Social Integrations</h2>
          <p className="text-sm text-zinc-400 leading-7">
            When you authenticate with social providers to enable posting or analytics, those providers may set cookies according to their policies. The CRM does not control how third parties manage those cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Managing & Disabling Cookies</h2>
          <p className="text-sm text-zinc-400 leading-7">
            You can control cookies through your browser settings. Disabling essential cookies may prevent login or critical features from working. For analytics or preference cookies, use browser controls or disconnect related third-party services from settings.
          </p>
        </section>

        <div className="border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <p className="mb-3">Return to <Link to="/login" className="text-yellow-500 hover:text-yellow-400">Login</Link> anytime.</p>
          <p>If you need help managing cookies or connected services, ask your administrator or contact support.</p>
        </div>
      </div>
    </div>
  </div>
);

export default CookiesPolicyPage;
