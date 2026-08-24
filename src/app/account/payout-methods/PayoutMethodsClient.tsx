'use client';

import { useState } from 'react';
import { Banknote, CheckCircle, AlertCircle, Clock, Loader2, Plus, Trash2, Edit, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { VERIFICATION_STATUS_META } from '@/lib/enums';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

type BankAccount = {
  id: string;
  accountHolder: string;
  accountNumber: string | null;
  ifsc: string | null;
  bankName: string | null;
  branch: string | null;
  verificationStatus: string;
  isDefault: boolean;
  createdAt: Date;
};

type PayoutMethodsClientProps = {
  initialAccounts: BankAccount[];
};

export function PayoutMethodsClient({ initialAccounts }: PayoutMethodsClientProps) {
  const toast = useToast();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    setAsDefault: false,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const resetForm = () => setFormData({ accountHolder: '', accountNumber: '', ifsc: '', setAsDefault: false });

  const handleAdd = async () => {
    if (!formData.accountHolder.trim() || !formData.accountNumber.trim() || !formData.ifsc.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (formData.ifsc.length !== 11) {
      toast.error('IFSC must be 11 characters');
      return;
    }
    setIsAdding(true);
    try {
      const res = await api('/api/account/payout-methods', {
        method: 'POST',
        json: {
          accountHolder: formData.accountHolder.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifsc: formData.ifsc.trim().toUpperCase(),
          setAsDefault: formData.setAsDefault,
        },
      });
      if (res.ok) {
        toast.success('Bank account added. Starting verification...');
        setAccounts((prev) => [...prev, res.data as BankAccount]);
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to add account');
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerify = async (account: BankAccount) => {
    setIsVerifying(account.id);
    try {
      const res = await api('/api/account/payout-methods/verify', {
        method: 'POST',
        json: { accountId: account.id },
      });
      if (res.ok) {
        toast.success('Verification started. This takes a few minutes.');
        setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, verificationStatus: 'pending' } : a)));
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to start verification');
    } finally {
      setIsVerifying(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Remove this bank account?')) return;
    try {
      const res = await api(`/api/account/payout-methods/${accountId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Bank account removed');
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to remove account');
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const res = await api(`/api/account/payout-methods/${accountId}/default`, { method: 'POST' });
      if (res.ok) {
        toast.success('Default account updated');
        setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === accountId })));
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to update default');
    }
  };

  const getStatusMeta = (status: string) => VERIFICATION_STATUS_META[status as keyof typeof VERIFICATION_STATUS_META] ?? { label: status, tone: 'slate' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Payout methods</h1>
          <p className="mt-1 text-sm text-ink-3">
            Add and verify bank accounts for referral commission withdrawals. A penny-drop check confirms the account name matches.
          </p>
        </div>
        <Button onClick={() => { setShowAddModal(true); resetForm(); }} size="md" variant="primary">
          <Plus className="size-3.5 mr-1.5" aria-hidden />
          Add bank account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<Banknote className="size-5" />}
          title="No bank accounts added"
          description="Add a bank account to receive referral commission payouts. Verification is instant via penny drop."
          action={
            <Button onClick={() => { setShowAddModal(true); resetForm(); }} size="md">
              <Plus className="size-3.5 mr-1.5" aria-hidden />
              Add your first account
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => {
            const statusMeta = getStatusMeta(account.verificationStatus);
            return (
              <Panel key={account.id} className={account.verificationStatus === 'unverified' ? 'ring-1 ring-amber-400/30 ring-inset' : ''}>
                <PanelBody className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-12 rounded-lg bg-plasma-500/10 flex items-center justify-center">
                        <Banknote className="size-5 text-plasma-300" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-ink truncate">{account.accountHolder}</p>
                          {account.isDefault && <Badge tone="violet" size="xs">Default</Badge>}
                          <Badge tone={statusMeta.tone} size="sm" dot>{statusMeta.label}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-3 truncate">
                          {account.bankName} · {account.branch}
                        </p>
                        <p className="tabular text-xs text-ink-4">
                          •••• {account.accountNumber?.slice(-4) ?? '----'} · IFSC: {account.ifsc ?? '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {account.verificationStatus === 'unverified' && (
                        <Button size="sm" variant="primary" onClick={() => handleVerify(account)} loading={isVerifying === account.id} disabled={isVerifying === account.id}>
                          <ShieldCheck className="size-3.5 mr-1.5" aria-hidden />
                          Verify
                        </Button>
                      )}
                      {account.verificationStatus === 'pending' && (
                        <Button size="sm" variant="ghost" disabled>
                          <Loader2 className="size-3.5 animate-spin mr-1.5" aria-hidden />
                          Verifying…
                        </Button>
                      )}
                      {!account.isDefault && account.verificationStatus === 'verified' && (
                        <Button size="sm" variant="outline" onClick={() => handleSetDefault(account.id)}>
                          Set default
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)} className="text-rose-400 hover:bg-rose-400/10">
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>

                  {account.verificationStatus === 'failed' && (
                    <div className="mt-3 p-3 rounded-lg bg-rose-400/10 ring-1 ring-inset ring-rose-400/30">
                      <div className="flex items-center gap-2 text-sm text-rose-400">
                        <AlertCircle className="size-4 shrink-0" aria-hidden />
                        <span>Verification failed. The account name did not match. Please check the details and try again.</span>
                      </div>
                    </div>
                  )}

                  {account.verificationStatus === 'verified' && (
                    <p className="mt-3 text-sm text-ink-3">
                      <ShieldCheck className="size-3.5 inline mr-1.5 text-emerald-400" aria-hidden />
                      Verified and ready for withdrawals.
                    </p>
                  )}
                </PanelBody>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Add account modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add bank account">
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            We&apos;ll deposit ₹1 to verify the account holder name matches. This is instant and the ₹1 stays in your account.
          </p>
          <div>
            <label htmlFor="account-holder" className="block text-sm font-medium text-ink mb-1">Account holder name *</label>
            <Input
              id="account-holder"
              value={formData.accountHolder}
              onChange={(e) => setFormData((prev) => ({ ...prev, accountHolder: e.target.value }))}
              placeholder="As per bank records"
              className="w-full"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="account-number" className="block text-sm font-medium text-ink mb-1">Account number *</label>
              <Input
                id="account-number"
                value={formData.accountNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="1234567890"
                className="w-full"
                inputMode="numeric"
              />
            </div>
            <div>
              <label htmlFor="ifsc" className="block text-sm font-medium text-ink mb-1">IFSC *</label>
              <Input
                id="ifsc"
                value={formData.ifsc}
                onChange={(e) => setFormData((prev) => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                placeholder="SBIN0001234"
                className="w-full"
                maxLength={11}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.setAsDefault}
              onChange={(e) => setFormData((prev) => ({ ...prev, setAsDefault: e.target.checked }))}
              className="size-4 rounded border-line bg-panel-2 text-volt-400 focus:ring-volt-400"
            />
            <span className="text-sm text-ink-2">Set as default payout account</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }} disabled={isAdding}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={isAdding} disabled={isAdding}>
              Add account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}