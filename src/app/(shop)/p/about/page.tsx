import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About VOLTAGE — Ultra-Premium Mobile & Electronics',
  description: 'Learn about VOLTAGE, your trusted destination for ultra-premium mobile phones and electronics with same-day dispatch, GST invoice, and warranty tracking.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          About VOLTAGE
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Your trusted destination for ultra-premium mobile phones and electronics.
        </p>
      </header>

      <div className="prose prose-slate max-w-none">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Who We Are</h2>
          <p className="text-ink-2">
            VOLTAGE is India's premier online destination for ultra-premium mobile phones and electronics. 
            We specialize in bringing you the latest flagship devices from the world's leading brands, 
            backed by genuine warranties, transparent pricing, and exceptional customer service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">What Makes Us Different</h2>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li><strong>Genuine Products:</strong> 100% authentic devices with manufacturer warranties</li>
            <li><strong>GST Invoice:</strong> Proper tax invoices for all purchases</li>
            <li><strong>Same-Day Dispatch:</strong> Orders placed before 2 PM ship the same day</li>
            <li><strong>No-Cost EMI:</strong> Flexible payment options on all major credit and debit cards</li>
            <li><strong>Warranty Tracking:</strong> Digital warranty cards and service center network</li>
            <li><strong>Expert Support:</strong> Dedicated customer service team</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Our Promise</h2>
          <p className="text-ink-2">
            At VOLTAGE, we believe that buying premium electronics should be a seamless experience. 
            That's why we've built our platform to be transparent, trustworthy, and customer-first. 
            Every device we sell comes with complete documentation, genuine accessories, and our 
            commitment to your satisfaction.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Contact Us</h2>
          <p className="text-ink-2">
            Have questions? Our customer support team is here to help.
          </p>
          <ul className="list-none space-y-2 text-ink-2">
            <li><strong>Email:</strong> support@voltage.store</li>
            <li><strong>Phone:</strong> 1800-123-8654 (Mon-Sat, 10 AM - 7 PM)</li>
            <li><strong>Address:</strong> Tower B, Prestige Tech Park, Outer Ring Road, Bengaluru 560103</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
