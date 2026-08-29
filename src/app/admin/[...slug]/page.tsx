import { Construction } from 'lucide-react';
import { Panel, PanelBody } from '@/components/ui/panel';

export default async function AdminCatchAll({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = '/' + slug.join('/');

  return (
    <Panel>
      <PanelBody className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-panel-2">
          <Construction className="size-7 text-ink-4" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-ink">Coming soon</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-3">
          The <span className="font-medium text-ink-2">/admin/{path}</span> module is under construction.
          Check back soon or contact a Super Admin for access.
        </p>
      </PanelBody>
    </Panel>
  );
}
