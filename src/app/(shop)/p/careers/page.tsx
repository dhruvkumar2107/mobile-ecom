import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers at VOLTAGE — Join Our Team',
  description: 'Explore career opportunities at VOLTAGE. Join us in building the future of premium electronics retail in India.',
};

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Careers at VOLTAGE
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Join us in building the future of premium electronics retail.
        </p>
      </header>

      <div className="prose prose-slate max-w-none">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Why Work With Us</h2>
          <p className="text-ink-2">
            At VOLTAGE, we're building more than just an e-commerce platform. We're creating 
            the future of how people discover, research, and buy premium electronics in India. 
            Our team is passionate about technology, customer experience, and pushing boundaries.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">What We Offer</h2>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Competitive salary and equity opportunities</li>
            <li>Health insurance for you and your family</li>
            <li>Flexible work arrangements</li>
            <li>Learning and development budget</li>
            <li>Latest tech devices to work with</li>
            <li>Collaborative and innovative work environment</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Open Positions</h2>
          <p className="text-ink-2">
            We're always looking for talented individuals to join our team. 
            Current openings include:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Senior Full-Stack Engineer</li>
            <li>Product Manager</li>
            <li>Customer Experience Specialist</li>
            <li>Digital Marketing Manager</li>
            <li>Operations Associate</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Apply Now</h2>
          <p className="text-ink-2">
            Interested in joining VOLTAGE? Send your resume and cover letter to:
          </p>
          <p className="text-ink-2">
            <strong>Email:</strong> careers@voltage.store
          </p>
          <p className="text-ink-2">
            We review all applications and will get back to you within 2 weeks if your profile matches our requirements.
          </p>
        </section>
      </div>
    </div>
  );
}
