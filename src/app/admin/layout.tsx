import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthError, requireStaff, type CurrentUser } from '@/lib/auth';
import { driverStatus } from '@/lib/gateways';
import { AdminShell } from '@/components/admin/shell';
import { NoAccess } from '@/components/admin/permission-gate';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin · VOLTAGE' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // requireStaff() throws for both cases, but they need opposite treatments:
  // a signed-out visitor should land on /login, while a signed-in customer who
  // guessed the URL must see a dead end — redirecting them to /login when they
  // are already authenticated is the classic sign-in loop.
  let user: CurrentUser | null = null;
  let forbidden = false;
  try {
    user = await requireStaff();
  } catch (err) {
    if (!(err instanceof AuthError)) throw err;
    if (err.status === 403) forbidden = true;
  }

  if (forbidden) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-10">
        <div className="w-full">
          <NoAccess
            title="This area is for staff accounts"
            description="Your account is signed in but has no admin role. If you should have access, ask a Super Admin to add you under Staff & roles."
            action={
              <ButtonLink href="/" variant="outline" size="sm">
                Go to storefront
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  }

  if (!user) redirect('/login?next=/admin');

  return (
    <AdminShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        staffRoleName: user.staffRoleName,
        permissions: user.permissions,
      }}
      gateways={driverStatus()}
    >
      {children}
    </AdminShell>
  );
}
