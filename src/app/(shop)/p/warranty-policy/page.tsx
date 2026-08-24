import { Metadata } from 'next';
import { ShieldCheck, RotateCcw, Clock, AlertCircle, CheckCircle, Truck, LifeBuoy, Package, Headphones, Smartphone, Watch } from 'lucide-react';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge } from '@/components/ui/panel';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Warranty & repair policy',
  description: 'VOLTAGE warranty policy: IMEI-locked manufacturer warranty, repair process, extended protection plans and service centre network.',
};

const WARRANTY_SECTIONS = [
  {
    title: 'Standard manufacturer warranty',
    icon: ShieldCheck,
    items: [
      'Every device sold on VOLTAGE carries the original manufacturer warranty — we are an authorised partner for all listed brands.',
      'Warranty is IMEI-locked: the serial number on your device is registered at dispatch and tied to your order. No physical warranty card is required; the IMEI is your proof.',
      'Standard warranty periods: Phones (12 months), Tablets (12 months), Wearables (12 months), Audio (12 months), Accessories (6–12 months per brand).',
      'Covers manufacturing defects in materials and workmanship. Does not cover accidental damage, liquid ingress, unauthorised repairs, or cosmetic wear.',
    ],
  },
  {
    title: 'What happens when you need a repair',
    icon: RotateCcw,
    items: [
      'Create a service request from your account or visit any authorised service centre directly — no pre-authorisation needed for in-warranty repairs.',
      'Present your order number or the device IMEI. The centre verifies warranty status instantly from the brand database.',
      'In-warranty repairs are free of charge (parts + labour). Out-of-warranty repairs are quoted upfront; you approve before work begins.',
      'Turnaround target: 5–7 business days for most phones. Complex board-level repairs may take longer — the centre will communicate timelines.',
    ],
  },
  {
    title: 'Extended protection plans',
    icon: Clock,
    items: [
      'Available at checkout for eligible devices: 12- or 24-month extensions beyond the standard warranty.',
      'Plans cover mechanical and electrical failure. Some tiers add accidental damage protection (screen break, liquid damage) with a service fee per claim.',
      'Protection plan purchases generate a separate warranty card with its own expiry date — both the manufacturer and plan warranties run concurrently.',
      'Transferable if you sell the device: the plan stays with the IMEI, not the buyer.',
    ],
  },
  {
    title: 'Doors-stepp exchange (select cities)',
    icon: Truck,
    items: [
      'For eligible devices under warranty, we arrange a courier pickup from your address — you don&apos;t need to visit a centre.',
      'The device is shipped to the nearest authorised centre, repaired, and delivered back. Tracking is shared at every step.',
      'Available in metro and Tier-1 cities for phones and tablets. Check your pincode at checkout or on the service centres page.',
    ],
  },
  {
    title: 'What voids the warranty',
    icon: AlertCircle,
    items: [
      'Physical damage: cracked screen, bent frame, liquid indicators triggered.',
      'Unauthorised disassembly or repair by non-brand centres.',
      'Rooting, custom firmware, or bootloader unlocking (where the brand explicitly prohibits it).',
      'Use of non-genuine accessories that cause damage (e.g., counterfeit chargers).',
      'Removal or tampering with IMEI / serial number labels.',
    ],
  },
  {
    title: 'Genuine parts guarantee',
    icon: CheckCircle,
    items: [
      'All repairs at authorised centres use OEM parts sourced directly from the brand.',
      'No third-party or refurbished components are used unless the brand\'s official repair program supplies them.',
      'Parts replaced under warranty carry the remaining warranty of the original device or 90 days, whichever is longer.',
    ],
  },
  {
    title: 'Data privacy during repair',
    icon: LifeBuoy,
    items: [
      'We recommend backing up and performing a factory reset before handing over your device.',
      'Service centres follow brand-mandated data handling protocols. Technicians do not access personal data unless required for diagnostics (with your consent).',
      'For board-level repairs where data recovery is impossible, you are informed beforehand.',
    ],
  },
];

const CATEGORY_WARRANTY: Record<string, { months: number; icon: React.ComponentType<{ className?: string }> }> = {
  phone: { months: 12, icon: Smartphone },
  tablet: { months: 12, icon: Smartphone },
  wearable: { months: 12, icon: Watch },
  audio: { months: 12, icon: Headphones },
  accessory: { months: 6, icon: Package },
};

export default function WarrantyPolicyPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header className="space-y-2">
        <Badge tone="violet" size="sm">Policy</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Warranty & repair policy</h1>
        <p className="text-lg text-ink-2">
          Every device from VOLTAGE comes with a genuine manufacturer warranty, tracked by IMEI. Here is what is covered,
          how to claim, and the options to extend your protection.
        </p>
      </header>

      <div className="space-y-6">
        {WARRANTY_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <Panel key={i}>
              <PanelHeader title={section.title} icon={<Icon className="size-4" />} />
              <PanelBody className="space-y-3">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 text-sm text-ink-2">
                    <CheckCircle className="size-4 mt-0.5 shrink-0 text-good-400" aria-hidden />
                    {item}
                  </div>
                ))}
              </PanelBody>
            </Panel>
          );
        })}

        {/* Category warranty quick reference */}
        <Panel>
          <PanelHeader title="Standard warranty by category" icon={<Package className="size-4" />} />
          <PanelBody className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(CATEGORY_WARRANTY).map(([key, data]) => {
                const Icon = data.icon;
                return (
                  <div
                    key={key}
                    className="p-4 rounded-lg bg-panel-2 ring-1 ring-inset ring-line text-center"
                  >
                    <Icon className="size-6 mx-auto text-volt-300" aria-hidden />
                    <p className="mt-2 text-sm font-medium text-ink capitalize">{key}</p>
                    <p className="mt-0.5 tabular text-lg font-semibold text-ink">{data.months} months</p>
                  </div>
                );
              })}
            </div>
          </PanelBody>
        </Panel>

        {/* FAQ */}
        <Panel>
          <PanelHeader title="Frequently asked questions" icon={<LifeBuoy className="size-4" />} />
          <PanelBody className="space-y-4">
            <FAQItem
              q="Do I need to keep the box and accessories for warranty?"
              a="No. The warranty is tied to the device IMEI, not the packaging. However, keeping the original box helps if you ever need to ship the device for repair."
            />
            <FAQItem
              q="Can I get my device repaired at any local shop?"
              a="Only authorised service centres can perform in-warranty repairs without voiding the warranty. Unauthorised repairs will void the remaining manufacturer warranty."
            />
            <FAQItem
              q="What if the same issue happens again after repair?"
              a="Parts replaced under warranty carry the remaining device warranty or 90 days, whichever is longer. If the same fault recurs, the repair is re-done at no charge."
            />
            <FAQItem
              q="How do I check my device&apos;s warranty status?"
              a="Sign in to your VOLTAGE account and go to Orders → View order. The warranty expiry date is shown for each item. You can also check at any authorised centre using the IMEI."
            />
            <FAQItem
              q="Does the warranty cover battery degradation?"
              a="Most brands cover battery defects (swelling, failure to charge) but not normal capacity loss over time. Some extended protection plans include battery replacement if capacity drops below 80%."
            />
            <FAQItem
              q="Can I transfer the warranty if I sell my phone?"
              a="Yes. The manufacturer warranty follows the IMEI, not the owner. The new owner can claim warranty at any authorised centre with the device alone."
            />
          </PanelBody>
        </Panel>

        {/* Contact */}
        <Panel className="ring-1 ring-plasma-400/20 ring-inset">
          <PanelHeader title="Need help with a repair?" icon={<LifeBuoy className="size-4" />} />
          <PanelBody className="p-5 space-y-3">
            <p className="text-sm text-ink-2">
              Create a service request from your account, visit a service centre directly, or contact our support team.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/account/service-requests" variant="primary" size="md">
                Create service request
              </ButtonLink>
              <ButtonLink href="/service-centres" variant="outline" size="md">
                Find a service centre
              </ButtonLink>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-t border-line pt-4 first:border-0 first:pt-0">
      <p className="text-sm font-medium text-ink">{q}</p>
      <p className="mt-1.5 text-sm text-ink-3">{a}</p>
    </div>
  );
}