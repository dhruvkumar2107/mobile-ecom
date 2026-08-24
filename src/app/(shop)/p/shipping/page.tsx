import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy — VOLTAGE',
  description: 'Learn about our shipping options, delivery times, and shipping charges at VOLTAGE.',
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Shipping Policy
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Fast, secure delivery across India.
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Shipping Options</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-ink">Standard Shipping</h3>
              <ul className="list-disc space-y-1 pl-6 text-ink-2">
                <li>Delivery: 3-5 business days</li>
                <li>Cost: ₹99 (Free on orders above ₹4,999)</li>
                <li>Available across India</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Express Shipping</h3>
              <ul className="list-disc space-y-1 pl-6 text-ink-2">
                <li>Delivery: 1-2 business days</li>
                <li>Cost: ₹299</li>
                <li>Available in major metros</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Same-Day Dispatch</h2>
          <p className="text-ink-2">
            Orders placed before 2:00 PM IST on business days are dispatched the same day. 
            Orders placed after 2:00 PM or on weekends/holidays are dispatched the next business day.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Shipping Locations</h2>
          <p className="text-ink-2">
            We ship to all serviceable pincodes across India. You can check serviceability 
            by entering your pincode on the product page.
          </p>
          <p className="text-ink-2">
            <strong>Note:</strong> Some remote locations may have extended delivery times. 
            Cash on Delivery (COD) may not be available for all pincodes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Order Tracking</h2>
          <p className="text-ink-2">
            Once your order is shipped, you'll receive:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Shipment confirmation email with tracking number</li>
            <li>Real-time tracking updates via SMS</li>
            <li>Delivery notifications</li>
          </ul>
          <p className="text-ink-2">
            You can track your order anytime from your account dashboard or using the tracking 
            link sent to your email.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Packaging</h2>
          <p className="text-ink-2">
            All products are carefully packaged to ensure safe delivery:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Tamper-proof packaging</li>
            <li>Bubble wrap and protective materials</li>
            <li>Sealed boxes with security tape</li>
            <li>Weather-resistant outer packaging</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Delivery Process</h2>
          <ol className="list-decimal space-y-2 pl-6 text-ink-2">
            <li>Our delivery partner will call you before delivery</li>
            <li>A valid ID proof is required for order handover</li>
            <li>Please inspect the package before accepting</li>
            <li>Sign the delivery receipt upon satisfaction</li>
            <li>Report any damage immediately to our support team</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Failed Delivery Attempts</h2>
          <p className="text-ink-2">
            If delivery fails due to:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li><strong>Unavailability:</strong> Delivery will be reattempted</li>
            <li><strong>Incorrect address:</strong> Contact support to update address</li>
            <li><strong>Refused delivery:</strong> Order will be returned and refunded</li>
          </ul>
          <p className="text-ink-2">
            After 3 failed attempts, the order is returned to our warehouse and refunded 
            after deducting shipping charges.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Shipping Restrictions</h2>
          <p className="text-ink-2">
            We currently do not ship:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-ink-2">
            <li>Outside India</li>
            <li>To P.O. boxes</li>
            <li>To military addresses (contact support for special arrangements)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ink">Questions About Shipping?</h2>
          <p className="text-ink-2">
            Contact our support team:
          </p>
          <p className="text-ink-2">
            <strong>Email:</strong> shipping@voltage.store<br />
            <strong>Phone:</strong> 1800-123-8654<br />
            <strong>Hours:</strong> Mon-Sat, 10 AM - 7 PM IST
          </p>
        </section>
      </div>
    </div>
  );
}
