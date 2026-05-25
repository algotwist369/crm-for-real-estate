import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold text-white">Privacy Policy</h1>
        <p className="text-sm text-zinc-400">
          This policy explains how AlgoTwist CRM collects, processes, stores, and shares data when you use the platform, including when you connect social accounts.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Types of Data We Collect</h2>
          <p className="text-sm text-zinc-400 leading-7">
            We collect personal and business information you provide (e.g., names, emails, phone numbers), content you upload (lead notes, property details, campaign creative), and metadata (timestamps, activity logs). When you connect social networks, we may also store tokens and basic profile metadata required for integration.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. How We Use Data</h2>
          <p className="text-sm text-zinc-400 leading-7">
            Data enables the CRM to operate: authenticate users, route leads, power campaigns, send notifications, and allow social publishing where authorized. We also use aggregated, anonymized usage data to improve the product.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Data Sharing & Third Parties</h2>
          <p className="text-sm text-zinc-400 leading-7">
            We may share data with third-party providers that perform services on our behalf (e.g., email delivery, analytics, social connectors). When sharing data with social platforms to publish content, that provider's policies apply to the posted content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Data Retention & Deletion</h2>
          <p className="text-sm text-zinc-400 leading-7">
            We retain account and content data for as long as your account is active or as necessary to provide services. Administrators can delete or export data via the platform; contact support for account-level removal requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Security Practices</h2>
          <p className="text-sm text-zinc-400 leading-7">
            The platform uses encryption in transit (HTTPS), secure credential storage, and role-based access controls. While we strive to protect data, no system is perfectly secure—use strong passwords and limit shared access when possible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
          <p className="text-sm text-zinc-400 leading-7">
            Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data. To exercise these rights, contact your administrator or support representative.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Social Connections & Tokens</h2>
          <p className="text-sm text-zinc-400 leading-7">
            When connecting social accounts, we store tokens necessary to perform authorized actions (posting, fetching insights). Tokens are encrypted and used only for the connection's intended purpose. You can disconnect an account at any time from settings.
          </p>
        </section>

        <div className="border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <p className="mb-3">Return to <Link to="/login" className="text-yellow-500 hover:text-yellow-400">Login</Link> anytime.</p>
          <p>If you have privacy questions, raise them with your administrator or contact support for more information about data handling practices.</p>
        </div>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyPage;
