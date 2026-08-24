import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — VOLTAGE',
  description: 'Read our terms of service to understand the rules and regulations for using VOLTAGE.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-ink-3">
          Last updated: January 2025
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Agreement to Terms</h2>
          <p className="text-ink-2">
            By accessing or using VOLTAGE's website and services, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Use of Services</h2>
          <p className="text-ink-2">You agree to:</p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Not use our services for any unlawful purpose</li>
            <li>Not interfere with or disrupt our services</li>
            <li>Not attempt to gain unauthorized access to our systems</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Product Information</h2>
          <p className="text-ink-2">
            We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant 
            that product descriptions or other content is accurate, complete, or error-free. We reserve the right 
            to correct errors, inaccuracies, or omissions and to change or update information at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Orders and Payment</h2>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>All orders are subject to acceptance and availability</li>
            <li>We reserve the right to refuse or cancel any order</li>
            <li>Prices are inclusive of all applicable taxes</li>
            <li>Payment must be made at the time of order placement</li>
            <li>We accept various payment methods including cards, UPI, and net banking</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Delivery</h2>
          <p className="text-ink-2">
            We ship to select locations across India. Delivery times are estimates and not guaranteed. 
            We are not liable for delays beyond our control. Risk of loss passes to you upon delivery.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Returns and Refunds</h2>
          <p className="text-ink-2">
            Please refer to our Returns & Refunds policy for detailed information about returns, 
            exchanges, and refunds. Certain products may not be eligible for return due to hygiene 
            or safety reasons.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Warranties</h2>
          <p className="text-ink-2">
            Products are covered by manufacturer warranties. We do not provide any additional warranties 
            beyond those provided by manufacturers. Warranty terms vary by product and manufacturer.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Limitation of Liability</h2>
          <p className="text-ink-2">
            To the maximum extent permitted by law, VOLTAGE shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages arising from your use of our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Intellectual Property</h2>
          <p className="text-ink-2">
            All content on our website, including text, graphics, logos, images, and software, is the 
            property of VOLTAGE or its content suppliers and is protected by copyright and other laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Governing Law</h2>
          <p className="text-ink-2">
            These Terms shall be governed by and construed in accordance with the laws of India. 
            Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Changes to Terms</h2>
          <p className="text-ink-2">
            We reserve the right to modify these Terms at any time. Changes will be effective immediately 
            upon posting to the website. Your continued use of our services constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Contact Information</h2>
          <p className="text-ink-2">
            For questions about these Terms, contact us at:
          </p>
          <p className="text-ink-2">
            <strong>Email:</strong> legal@voltage.store<br />
            <strong>Phone:</strong> 1800-123-8654<br />
            <strong>Address:</strong> Tower B, Prestige Tech Park, Outer Ring Road, Bengaluru 560103
          </p>
        </section>
      </div>
    </div>
  );
}
