import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — VOLTAGE',
  description: 'Read our privacy policy to understand how VOLTAGE collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-ink-3">
          Last updated: January 2025
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Introduction</h2>
          <p className="text-ink-2">
            VOLTAGE Retail Private Limited ("we", "our", or "VOLTAGE") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
            visit our website or make a purchase from us.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Information We Collect</h2>
          <p className="text-ink-2">We collect information that you provide directly to us, including:</p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Name, email address, phone number, and shipping address</li>
            <li>Payment information (processed securely through our payment partners)</li>
            <li>Order history and preferences</li>
            <li>Communication preferences and customer service interactions</li>
            <li>Device information and usage data when you visit our website</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">How We Use Your Information</h2>
          <p className="text-ink-2">We use the information we collect to:</p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders and account</li>
            <li>Provide customer support</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our website and services</li>
            <li>Detect and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Data Security</h2>
          <p className="text-ink-2">
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
            over the internet is 100% secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Your Rights</h2>
          <p className="text-ink-2">You have the right to:</p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Cookies</h2>
          <p className="text-ink-2">
            We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, 
            and personalize content. You can control cookies through your browser settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Third-Party Services</h2>
          <p className="text-ink-2">
            We use trusted third-party services for payment processing, shipping, and analytics. 
            These partners have their own privacy policies and handle your data according to their terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Changes to This Policy</h2>
          <p className="text-ink-2">
            We may update this Privacy Policy from time to time. We will notify you of any changes by 
            posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Contact Us</h2>
          <p className="text-ink-2">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-ink-2">
            <strong>Email:</strong> privacy@voltage.store<br />
            <strong>Phone:</strong> 1800-123-8654<br />
            <strong>Address:</strong> Tower B, Prestige Tech Park, Outer Ring Road, Bengaluru 560103
          </p>
        </section>
      </div>
    </div>
  );
}
