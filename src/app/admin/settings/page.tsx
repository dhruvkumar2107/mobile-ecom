import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { getSettingsForAdmin, updateSettings, type AppSettings } from '@/lib/services/settings';
import { Panel, PanelBody, PanelHeader, Row, Divider } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, RupeeInput, Switch } from '@/components/ui/input';
import { formatINR } from '@/lib/money';
import { Save } from 'lucide-react';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requireStaff('settings.read');
  const groups = await getSettingsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-ink-3">Configure store-wide operational parameters. Changes take effect immediately.</p>
      </div>

      <form id="settings-form" className="space-y-6">
        {groups.map((group) => (
          <Panel key={group.group} className="space-y-0">
            <PanelHeader title={group.group.charAt(0).toUpperCase() + group.group.slice(1)} />
            <PanelBody className="space-y-4 p-5">
              {group.items.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-ink-2">{item.label}</label>
                  {item.type === 'boolean' ? (
                    <Switch
                      name={item.key}
                      checked={item.value as boolean}
                      onChange={() => {}}
                    />
                  ) : item.type === 'number' ? (
                    <RupeeInput name={item.key} valuePaise={item.value as number} onChangePaise={() => {}} />
                  ) : (
                    <Input name={item.key} defaultValue={String(item.value ?? '')} />
                  )}
                </div>
              ))}
            </PanelBody>
          </Panel>
        ))}

      <div className="flex justify-end">
        <Button type="submit" icon={<Save className="size-4" />}>
          Save all changes
        </Button>
      </div>
      </form>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = new FormData(form);
            const patch: Record<string, unknown> = {};
            for (const [key, value] of data.entries()) {
              // Simple type inference from current value
              const existing = ${JSON.stringify(groups.flatMap(g => g.items))}.find(i => i.key === key);
              if (!existing) continue;
              if (existing.type === 'boolean') patch[key] = value === 'on';
              else if (existing.type === 'number') patch[key] = Math.round(parseFloat(value) * 100);
              else patch[key] = value;
            }
            const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
            if (res.ok) alert('Settings saved');
            else alert('Failed to save settings');
          });
        `
      }} />
    </div>
  );
}