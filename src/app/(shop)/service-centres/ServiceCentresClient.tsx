'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Search, X, Truck, ShieldCheck, Clock, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ServiceCenter } from '@prisma/client';
import { ServiceabilityResult } from '@/lib/services/serviceability';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

type ServiceCentre = ServiceCenter & {
  brandNames: string[];
  distanceKm: number | null;
  openHours: string;
};

type ServiceCentresClientProps = {
  initialCentres: ServiceCentre[];
  initialFilters: { pincode: string; city: string; state: string; brand: string };
  brands: Array<{ id: string; name: string; slug: string }>;
  states: string[];
  serviceability: ServiceabilityResult | null;
};

export function ServiceCentresClient({
  initialCentres,
  initialFilters,
  brands,
  states,
  serviceability,
}: ServiceCentresClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [centres, setCentres] = useState<ServiceCentre[]>(initialCentres);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCentres = useCallback(async (newFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (newFilters.pincode) params.set('pincode', newFilters.pincode);
      if (newFilters.city) params.set('city', newFilters.city);
      if (newFilters.state) params.set('state', newFilters.state);
      if (newFilters.brand) params.set('brand', newFilters.brand);
      const res = await fetch(`/api/service-centres?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCentres(data);
      }
    } catch {
      // Keep current centres on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFilters((prev) => ({ ...prev }));
      fetchCentres(filters);
    },
    [filters, fetchCentres]
  );

  const handleFilterChange = useCallback(
    (key: keyof typeof filters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    const empty = { pincode: '', city: '', state: '', brand: '' };
    setFilters(empty);
    fetchCentres(empty);
  }, [fetchCentres]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Service centres</h1>
          <p className="mt-1 text-sm text-ink-3">
            Find authorised service centres for warranty repairs, diagnostics and genuine parts.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Panel flat className="space-y-4">
        <PanelBody className="p-5 pt-0">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Primary search: pincode */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-4" aria-hidden />
                <Input
                  value={filters.pincode}
                  onChange={(e) => handleFilterChange('pincode', e.target.value)}
                  placeholder="Enter pincode for nearest centres"
                  className="pl-10"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <Button type="submit" size="md" loading={isLoading} className="shrink-0">
                Search
              </Button>
            </div>

            {/* Advanced filters */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={showFilters}
                  onChange={(e) => setShowFilters(e.target.checked)}
                  className="size-4 rounded border-line bg-panel-2 text-volt-400 focus:ring-volt-400"
                />
                Advanced filters
              </label>
              {filters.pincode && serviceability && (
                <Badge tone={serviceability.isServiceable ? 'emerald' : 'rose'} size="sm">
                  {serviceability.isServiceable ? 'Serviceable' : 'Not serviceable'} · {serviceability.zone}
                </Badge>
              )}
            </div>

            {showFilters && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-ink-3 mb-1">
                    City
                  </label>
                  <Input
                    id="city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="City name"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-xs font-medium text-ink-3 mb-1">
                    State
                  </label>
                  <Select
                    id="state"
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    options={[
                      { value: '', label: 'All states' },
                      ...states.map((s) => ({ value: s, label: s })),
                    ]}
                  />
                </div>
                <div>
                  <label htmlFor="brand" className="block text-xs font-medium text-ink-3 mb-1">
                    Brand
                  </label>
                  <Select
                    id="brand"
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    options={[
                      { value: '', label: 'All brands' },
                      ...brands.map((b) => ({ value: b.id, label: b.name })),
                    ]}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" size="sm" fullWidth onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </form>
        </PanelBody>
      </Panel>

      {/* Results */}
      {isLoading && centres.length === 0 ? (
        <Panel>
          <PanelBody className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-volt-300" aria-hidden />
          </PanelBody>
        </Panel>
      ) : centres.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-5" />}
          title="No service centres found"
          description={
            filters.pincode || filters.city || filters.state || filters.brand
              ? 'Try broadening your search or clearing some filters.'
              : 'We don&apos;t have any service centres listed yet. Check back soon.'
          }
          action={
            filters.pincode || filters.city || filters.state || filters.brand ? (
              <Button onClick={clearFilters} size="md">
                Clear all filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-3">
            Showing {centres.length} {centres.length === 1 ? 'centre' : 'centres'}{' '}
            {filters.pincode && `near ${filters.pincode}`}
          </p>
          {centres.map((centre) => (
            <ServiceCentreCard key={centre.id} centre={centre} />
          ))}
        </div>
      )}

      {!filters.pincode && (
        <Panel flat className="bg-panel-2/50">
          <PanelBody className="p-5">
            <div className="flex items-start gap-3">
              <Truck className="size-5 mt-0.5 shrink-0 text-volt-300" aria-hidden />
              <div>
                <p className="text-sm font-medium text-ink">Enter your pincode for accurate results</p>
                <p className="mt-1 text-sm text-ink-3">
                  We&apos;ll show you the nearest authorised centres with distance, hours and supported brands.
                </p>
              </div>
            </div>
          </PanelBody>
        </Panel>
      )}
    </div>
  );
}

function ServiceCentreCard({ centre }: { centre: ServiceCentre }) {
  return (
    <Panel className="space-y-0">
      <PanelBody className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-semibold text-ink">{centre.name}</p>
              {centre.distanceKm !== null && (
                <Badge tone="cyan" size="sm">
                  <Navigation className="size-3 mr-1" aria-hidden />
                  {centre.distanceKm} km
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-3">{centre.addressLine}, {centre.city}, {centre.state} {centre.pincode}</p>
            
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
<div className="flex items-center gap-2 text-sm text-ink-2">
  <Clock className="size-4 shrink-0 text-volt-300" aria-hidden />
  <span>{centre.openHours}</span>
</div>
            {centre.phone && (
              <a
                href={`tel:${centre.phone}`}
                className="flex items-center gap-1.5 text-sm font-medium text-volt-300 hover:text-volt-200"
              >
                <ShieldCheck className="size-3.5" aria-hidden />
                Call
              </a>
            )}
          </div>
        </div>

        {centre.brandNames.length > 0 && (
          <div className="mt-4 pt-4 border-t border-line">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-3">Authorised for:</span>
              {centre.brandNames.map((brand) => (
                <Badge key={brand} tone="violet" size="xs">{brand}</Badge>
              ))}
            </div>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}