import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press & Media — VOLTAGE',
  description: 'Press releases, media kit, and contact information for media inquiries about VOLTAGE.',
};

export default function PressPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Press & Media
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Media resources and press inquiries for VOLTAGE.
        </p>
      </header>

      <div className="prose prose-slate max-w-none">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">About VOLTAGE</h2>
          <p className="text-ink-2">
            VOLTAGE is India's leading online destination for ultra-premium mobile phones and electronics. 
            Founded with a mission to make flagship devices accessible with transparent pricing and 
            exceptional service, VOLTAGE has quickly become the trusted choice for tech enthusiasts 
            across India.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Media Inquiries</h2>
          <p className="text-ink-2">
            For press inquiries, interviews, or partnership opportunities, please contact:
          </p>
          <p className="text-ink-2">
            <strong>Email:</strong> press@voltage.store<br />
            <strong>Phone:</strong> +91 80 1234 5678
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Brand Assets</h2>
          <p className="text-ink-2">
            Our brand guidelines, logos, and media kit are available for download. 
            Please contact our press team for access to high-resolution assets.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Recent News</h2>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>VOLTAGE launches with curated selection of flagship devices</li>
            <li>Same-day dispatch service now available across major metros</li>
            <li>Partnership with leading service centers announced</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
