import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { findServiceCentres, checkPincode } from '@/lib/services/serviceability';
import { db } from '@/lib/db';
import { ServiceCentresClient } from './ServiceCentresClient';

export const metadata: Metadata = {
  title: 'Service centres',
  description: 'Find authorised VOLTAGE service centres near you. Filter by brand, city or pincode.',
};

interface ServiceCentresPageProps {
  searchParams: Promise<{
    pincode?: string;
    city?: string;
    state?: string;
    brand?: string;
  }>;
}

export default async function ServiceCentresPage({ searchParams }: ServiceCentresPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const [brands, states] = await Promise.all([
    db.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    db.serviceCenter.findMany({
      where: { isActive: true },
      select: { state: true },
      distinct: ['state'],
    }),
  ]);

  const pincode = params.pincode?.trim();
  const city = params.city?.trim();
  const state = params.state?.trim();
  const brandId = params.brand?.trim();

  let centres: Awaited<ReturnType<typeof findServiceCentres>> = [];
  let serviceability: Awaited<ReturnType<typeof checkPincode>> | null = null;

  if (pincode) {
    try {
      const [centresResult, service] = await Promise.all([
        findServiceCentres({ pincode, brandId: brandId ?? undefined }),
        checkPincode(pincode),
      ]);
      centres = centresResult;
      serviceability = service;
    } catch {
      centres = [];
      serviceability = null;
    }
  } else if (city || state) {
    centres = await findServiceCentres({ city, state, brandId: brandId ?? undefined });
  } else if (brandId) {
    centres = await findServiceCentres({ brandId });
  } else {
    centres = await findServiceCentres({});
  }

  return (
    <ServiceCentresClient
      initialCentres={centres}
      initialFilters={{ pincode: pincode ?? '', city: city ?? '', state: state ?? '', brand: brandId ?? '' }}
      brands={brands}
      states={states.map((s) => s.state).sort()}
      serviceability={serviceability}
    />
  );
}