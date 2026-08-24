'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/overlay';
import { AdminNav, AdminSidebar, useSidebarCollapsed } from './sidebar';
import { AdminTopbar, type AdminUser, type GatewayDriverStatus } from './topbar';

/**
 * The admin frame: fixed rail on `lg+`, drawer below it, sticky topbar and a
 * single content well. Every page under `/admin` renders into `children`, so
 * nothing here may depend on what a page contains.
 *
 * It is a client component because the rail collapse and the mobile drawer are
 * viewport state. `children` still arrives fully server-rendered — passing a
 * server subtree through a client boundary as a prop is the supported shape.
 */
export function AdminShell({
  user,
  children,
  gateways,
  breadcrumb,
}: {
  user: AdminUser;
  children: React.ReactNode;
  /** From `driverStatus()` in the server layout — see topbar.tsx for why. */
  gateways?: GatewayDriverStatus | null;
  breadcrumb?: React.ReactNode;
}): React.JSX.Element {
  const { collapsed, toggle, ready } = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <AdminSidebar
        permissions={user.permissions}
        collapsed={collapsed}
        onToggle={toggle}
        ready={ready}
      />

      <Sheet
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Voltage admin"
        side="left"
        className="max-w-[17rem]"
      >
        <AdminNav permissions={user.permissions} onNavigate={() => setDrawerOpen(false)} />
      </Sheet>

      {/* Padding must track SIDEBAR_W / SIDEBAR_RAIL_W in sidebar.tsx — Tailwind
          cannot read a runtime value, so the two are matched by hand. */}
      <div
        className={cn(
          'min-h-dvh',
          ready && 'transition-[padding] duration-300 ease-out',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64',
        )}
      >
        <AdminTopbar
          user={user}
          gateways={gateways}
          breadcrumb={breadcrumb}
          onOpenNav={() => setDrawerOpen(true)}
        />
        <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export type { AdminUser, GatewayDriverStatus };
