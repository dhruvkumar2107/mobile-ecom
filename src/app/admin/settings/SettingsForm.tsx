'use client';

import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SettingItem {
  key: string;
  label: string;
  type: string;
  value: unknown;
}

interface SettingsFormProps {
  groups: Array<{ group: string; items: SettingItem[] }>;
}

export function SettingsForm({ groups }: SettingsFormProps) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const patch: Record<string, unknown> = {};

    const allItems = groups.flatMap((g) => g.items);

    for (const [key, value] of data.entries()) {
      const existing = allItems.find((i) => i.key === key);
      if (!existing) continue;
      if (existing.type === 'boolean') patch[key] = value === 'on';
      else if (existing.type === 'number') patch[key] = Math.round(parseFloat(String(value)) * 100);
      else patch[key] = value;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        toast.success('Settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
      {groups.map((group) => (
        <div key={group.group} className="rounded-lg border border-line/50 bg-panel space-y-0">
          <div className="px-5 py-3 border-b border-line/30">
            <h3 className="text-sm font-medium text-ink">
              {group.group.charAt(0).toUpperCase() + group.group.slice(1)}
            </h3>
          </div>
          <div className="space-y-4 p-5">
            {group.items.map((item) => (
              <div key={item.key} className="space-y-1.5">
                <label className="text-xs font-medium text-ink-2">{item.label}</label>
                {item.type === 'boolean' ? (
                  <input
                    type="checkbox"
                    name={item.key}
                    defaultChecked={!!item.value}
                    className="h-4 w-4 rounded border-line accent-volt-500"
                  />
                ) : item.type === 'number' ? (
                  <input
                    type="number"
                    name={item.key}
                    defaultValue={typeof item.value === 'number' ? item.value / 100 : String(item.value ?? '')}
                    step="0.01"
                    className="w-full rounded-lg border border-line/50 bg-panel-2 px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
                  />
                ) : (
                  <input
                    type="text"
                    name={item.key}
                    defaultValue={String(item.value ?? '')}
                    className="w-full rounded-lg border border-line/50 bg-panel-2 px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-volt-500 focus:outline-none focus:ring-1 focus:ring-volt-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" icon={<Save className="size-4" />} disabled={saving}>
          {saving ? 'Saving...' : 'Save all changes'}
        </Button>
      </div>
    </form>
  );
}
