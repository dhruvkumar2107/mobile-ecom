import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { getSettingsForAdmin } from '@/lib/services/settings';
import { SettingsForm } from './SettingsForm';

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
      <SettingsForm groups={groups} />
    </div>
  );
}
