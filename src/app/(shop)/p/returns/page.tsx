import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Refunds — VOLTAGE',
  description: 'Learn about our returns and refunds policy for products purchased from VOLTAGE.',
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Returns & Refunds
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          We want you to be completely satisfied with your purchase.
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Return Policy</h2>
          <p className="text-ink-2">
            You may return most new, unopened items within 7 days of delivery for a full refund. 
            Items must be in their original packaging with all accessories, manuals, and documentation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Eligibility for Returns</h2>
          <p className="text-ink-2">To be eligible for a return:</p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Item must be unused and in the same condition as received</li>
            <li>Original packaging must be intact</li>
            <li>All accessories, manuals, and warranty cards must be included</li>
            <li>Serial numbers (IMEI/serial) must match the invoice</li>
            <li>Return request must be initiated within 7 days of delivery</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Non-Returnable Items</h2>
          <p className="text-ink-2">The following items cannot be returned:</p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Opened software or digital products</li>
            <li>Items marked as "non-returnable" on the product page</li>
            <li>Items with tampered seals or packaging</li>
            <li>Earphones and headphones (hygiene products) once opened</li>
            <li>Gift cards and vouchers</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">How to Return</h2>
          <ol className="list-decimal space-y-2 pl-6 text-ink-2">
            <li>Log in to your account and go to "My Orders"</li>
            <li>Select the item you wish to return</li>
            <li>Choose the reason for return</li>
            <li>Schedule a pickup or drop-off</li>
            <li>Pack the item securely with all accessories</li>
            <li>Hand over to our logistics partner</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Refund Process</h2>
          <p className="text-ink-2">
            Once we receive and inspect your return:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Inspection takes 2-3 business days</li>
            <li>If approved, refund is initiated to your original payment method</li>
            <li>Refund reaches your account within 5-7 business days</li>
            <li>You'll receive email notifications at each step</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Exchanges</h2>
          <p className="text-ink-2">
            We don't offer direct exchanges. If you need a different variant (color, storage, etc.), 
            please return the original item and place a new order for the variant you want.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Damaged or Defective Items</h2>
          <p className="text-ink-2">
            If you receive a damaged or defective item:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Report it within 48 hours of delivery</li>
            <li>Provide photos of the damage/defect</li>
            <li>We'll arrange a replacement or full refund</li>
            <li>No questions asked for genuine cases</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Cancellations</h2>
          <p className="text-ink-2">
            You can cancel your order before it ships. Once shipped, you'll need to return the item 
            as per our returns policy. Refunds for cancellations are processed within 3-5 business days.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Questions?</h2>
          <p className="text-ink-2">
            Contact our support team for help with returns or refunds:
          </p>
          <p className="text-ink-2">
            <strong>Email:</strong> returns@voltage.store<br />
            <strong>Phone:</strong> 1800-123-8654<br />
            <strong>Hours:</strong> Mon-Sat, 10 AM - 7 PM IST
          </p>
        </section>
      </div>
    </div>
  );
}
