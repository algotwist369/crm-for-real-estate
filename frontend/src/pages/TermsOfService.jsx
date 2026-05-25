import React from "react";
import { Link } from "react-router-dom";

const TermsOfServicePage = () => (
  <div className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold text-white">Terms & Conditions</h1>
        <p className="text-sm text-zinc-400">
          These terms set out the rules and expectations for using AlgoTwist CRM. They cover account use, permitted activities, social integrations, and responsibilities of users and administrators.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Acceptable Use</h2>
          <p className="text-sm text-zinc-400 leading-7">
            You may use the CRM to manage leads, properties, campaigns, agents, and related business operations. You must not use the platform to engage in spam, harassment, or unlawful activity. Administrative users should maintain strong credentials and limit access as appropriate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Social Media Integrations & Posting</h2>
          <p className="text-sm text-zinc-400 leading-7">
            When you connect external social accounts, the CRM will request the permissions required to post, read analytics, or manage content depending on the network. You remain responsible for the content you publish. Follow the terms of the connected social platforms and obtain any necessary rights to the content you publish.
          </p>
          <p className="text-sm text-zinc-400 leading-7">
            Integrations may require storing authentication tokens. Those tokens are used only to perform actions you authorize and are protected by the platform's security measures.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Intellectual Property</h2>
          <p className="text-sm text-zinc-400 leading-7">
            You retain ownership of the content you upload or create in the CRM (leads, property details, campaign content). By using the posting features, you grant the CRM a limited license to store and transmit that content to connected services for the purpose of performing the integration.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Security & Account Responsibility</h2>
          <p className="text-sm text-zinc-400 leading-7">
            Keep your account credentials confidential. Notify your administrator immediately if you suspect unauthorized access. The platform uses standard security practices (HTTPS, token-based auth) but you are responsible for protecting your devices and passwords.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Liability & Warranties</h2>
          <p className="text-sm text-zinc-400 leading-7">
            The CRM is provided "as-is" and the provider disclaims all warranties to the extent permitted by law. The provider is not responsible for losses resulting from misuse, misconfiguration, third-party services, or user-generated content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Changes to These Terms</h2>
          <p className="text-sm text-zinc-400 leading-7">
            We may update these terms as the product evolves. When material changes are made, we will notify administrators via the platform. Continued use after updates indicates acceptance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Contact & Disputes</h2>
          <p className="text-sm text-zinc-400 leading-7">
            For questions about these terms or to report abuse, contact your system administrator or the organization that provided access to AlgoTwist CRM. Disputes will be handled according to the governing law specified by your organization.
          </p>
        </section>

        <div className="border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <p className="mb-3">Return to <Link to="/login" className="text-yellow-500 hover:text-yellow-400">Login</Link> anytime.</p>
          <p>These terms are intended to be clear and practical for business users of the CRM. For legal advice, consult counsel.</p>
        </div>
      </div>
    </div>
  </div>
);

export default TermsOfServicePage;
