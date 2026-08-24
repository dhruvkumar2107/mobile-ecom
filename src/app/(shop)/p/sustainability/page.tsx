import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sustainability — VOLTAGE',
  description: "Learn about VOLTAGE's commitment to environmental sustainability and responsible electronics retail.",
};

export default function SustainabilityPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Sustainability
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Our commitment to the environment and responsible retail.
        </p>
      </header>

      <div className="prose prose-slate max-w-none">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Our Environmental Commitment</h2>
          <p className="text-ink-2">
            At VOLTAGE, we recognize our responsibility to minimize environmental impact. 
            We're committed to sustainable practices across our operations, from packaging 
            to logistics to end-of-life device management.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">What We're Doing</h2>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li><strong>Minimal Packaging:</strong> Using recyclable materials and eliminating unnecessary packaging</li>
            <li><strong>E-Waste Management:</strong> Partnering with certified e-waste recyclers for old device disposal</li>
            <li><strong>Carbon-Neutral Shipping:</strong> Working towards carbon-neutral delivery options</li>
            <li><strong>Device Trade-In:</strong> Encouraging device reuse through our exchange program</li>
            <li><strong>Paperless Operations:</strong> Digital invoices, warranties, and documentation</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Responsible Sourcing</h2>
          <p className="text-ink-2">
            We partner only with manufacturers who demonstrate commitment to ethical practices 
            and environmental standards. All our products come from authorized channels with 
            proper certifications.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Your Role</h2>
          <p className="text-ink-2">
            You can help by:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Trading in your old devices instead of discarding them</li>
            <li>Recycling packaging materials</li>
            <li>Choosing devices with longer lifecycles</li>
            <li>Opting for repair over replacement when possible</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
