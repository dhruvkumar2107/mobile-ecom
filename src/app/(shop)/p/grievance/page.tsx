import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grievance Redressal — VOLTAGE',
  description: 'File a grievance or escalate an issue with VOLTAGE customer support.',
};

export default function GrievancePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Grievance Redressal
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          We're committed to resolving your concerns promptly and fairly.
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Our Commitment</h2>
          <p className="text-ink-2">
            At VOLTAGE, customer satisfaction is our top priority. If you have a complaint or concern 
            about our products or services, we want to hear from you and work towards a resolution.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">How to File a Grievance</h2>
          <p className="text-ink-2">
            You can reach out to us through any of these channels:
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-ink">1. Customer Support</h3>
              <p className="text-ink-2">
                Start with our customer support team for most issues:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-ink-2">
                <li>Email: support@voltage.store</li>
                <li>Phone: 1800-123-8654</li>
                <li>Hours: Mon-Sat, 10 AM - 7 PM IST</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-ink">2. Grievance Officer</h3>
              <p className="text-ink-2">
                If your issue is not resolved satisfactorily, contact our Grievance Officer:
              </p>
              <ul className="list-none space-y-1 text-ink-2">
                <li><strong>Name:</strong> Rajesh Kumar</li>
                <li><strong>Designation:</strong> Grievance Redressal Officer</li>
                <li><strong>Email:</strong> grievance@voltage.store</li>
                <li><strong>Phone:</strong> +91 80 2345 6789</li>
                <li><strong>Address:</strong> VOLTAGE Retail Private Limited<br />
                    Tower B, Prestige Tech Park<br />
                    Outer Ring Road<br />
                    Bengaluru 560103, Karnataka, India
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Information to Include</h2>
          <p className="text-ink-2">
            When filing a grievance, please provide:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Your full name and contact information</li>
            <li>Order number (if applicable)</li>
            <li>Detailed description of the issue</li>
            <li>Any relevant documentation (photos, invoices, emails)</li>
            <li>Previous communication reference numbers</li>
            <li>Desired resolution</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Resolution Timeline</h2>
          <p className="text-ink-2">
            We strive to resolve all grievances as quickly as possible:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li><strong>Acknowledgment:</strong> Within 48 hours of receipt</li>
            <li><strong>Investigation:</strong> 3-5 business days for most issues</li>
            <li><strong>Resolution:</strong> Within 7-10 business days</li>
            <li><strong>Complex cases:</strong> May take longer; we'll keep you updated</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Escalation Process</h2>
          <p className="text-ink-2">
            If you're not satisfied with the resolution:
          </p>
          <ol className="list-decimal space-y-2 pl-6 text-ink-2">
            <li>Request escalation to senior management</li>
            <li>Your case will be reviewed by our Customer Experience Head</li>
            <li>Final decision will be communicated within 5 business days</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Consumer Rights</h2>
          <p className="text-ink-2">
            As a consumer in India, you have rights under the Consumer Protection Act, 2019. 
            If your grievance is not resolved satisfactorily through our internal process, 
            you may approach:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>National Consumer Helpline: 1800-11-4000</li>
            <li>Consumer Disputes Redressal Commission</li>
            <li>Online dispute resolution platform: consumerhelpline.gov.in</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Feedback</h2>
          <p className="text-ink-2">
            We value your feedback and use it to improve our services. Even if you don't have 
            a specific grievance, feel free to share suggestions or compliments at 
            feedback@voltage.store
          </p>
        </section>
      </div>
    </div>
  );
}
