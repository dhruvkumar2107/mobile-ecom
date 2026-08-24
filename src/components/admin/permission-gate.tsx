import { ShieldAlert } from 'lucide-react';
import { EmptyState, Panel } from '@/components/ui/panel';
import { ButtonLink } from '@/components/ui/button';
import { MODULE_LABELS, hasPermission, type Permission, type PermissionModule } from '@/lib/rbac';

/**
 * Page-level permission helpers. Deliberately server-safe (no `'use client'`,
 * no `server-only`) so an admin page can branch on a permission and render the
 * refusal inline instead of throwing a 403 through the layout.
 */

/** `hasPermission` with a user object instead of a bare array. */
export function can(
  user: { permissions: string[] } | null | undefined,
  permission: Permission,
): boolean {
  return hasPermission(user?.permissions, permission);
}

/** What to render when a page-level check fails. */
export function NoAccess({
  permission,
  title = 'You do not have access to this',
  description,
  action,
}: {
  permission?: Permission;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const module = permission?.split('.')[0] as PermissionModule | undefined;
  const moduleLabel = module ? MODULE_LABELS[module] : undefined;

  return (
    <Panel>
      <EmptyState
        icon={<ShieldAlert className="size-6" aria-hidden />}
        title={title}
        description={
          description ??
          (moduleLabel
            ? `Your role does not include ${moduleLabel}. Ask a Super Admin to grant the "${permission}" permission.`
            : 'Ask a Super Admin to grant your role this permission.')
        }
        action={
          action ?? (
            <ButtonLink href="/admin" variant="outline" size="sm">
              Back to dashboard
            </ButtonLink>
          )
        }
      />
    </Panel>
  );
}
