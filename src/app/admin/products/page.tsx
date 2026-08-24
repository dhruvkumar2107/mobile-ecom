import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatINR } from '@/lib/money';
import { Panel, PanelBody, PanelHeader, PanelFooter, Row, Divider, EmptyState, Badge, StatTile } from '@/components/ui/panel';
import { ButtonLink } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { Select } from '@/components/ui/input';
import { Plus, Edit, Trash2, Image, Tag, Smartphone } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Products' };

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'coming_soon', label: 'Coming soon' },
];

const KIND_OPTIONS = [
  { value: '', label: 'All kinds' },
  { value: 'phone', label: 'Phone' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'wearable', label: 'Wearable' },
  { value: 'audio', label: 'Audio' },
  { value: 'tablet', label: 'Tablet' },
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; q?: string; page?: string }> }) {
  await requireStaff('products.read');
  const { status, kind, q, page = '1' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = 20;

  const where: any = {};
  if (status) where.status = status;
  if (kind) where.kind = kind;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { slug: { contains: q } },
      { brand: { name: { contains: q } } },
      { variants: { some: { sku: { contains: q } } } },
    ];
  }

  const [products, total, brands, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        kind: true,
        status: true,
        isFeatured: true,
        mrpPaise: true,
        pricePaise: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        variants: { select: { id: true, pricePaise: true, mrpPaise: true, isActive: true, colorName: true }, where: { isActive: true } },
        _count: { select: { variants: true } },
      },
    }),
    db.product.count({ where }),
    db.brand.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Products</h1>
          <p className="text-sm text-ink-3">{total} products · Page {pageNum} of {totalPages}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <ButtonLink href="/admin/products/new" variant="primary" size="sm" icon={<Plus className="size-3.5" />}>
            Add product
          </ButtonLink>
        </div>
      </div>

      <Panel>
        <PanelBody pad={false} className="space-y-4 p-4">
          <form className="flex flex-wrap items-center gap-3">
            <SearchInput
              name="q"
              placeholder="Search name, SKU, brand..."
              defaultValue={q}
              className="w-64"
            />
            <Select name="status" options={STATUS_OPTIONS} defaultValue={status} className="w-40" />
            <Select name="kind" options={KIND_OPTIONS} defaultValue={kind} className="w-40" />
            <ButtonLink href="/admin/products" variant="ghost" size="sm">Clear</ButtonLink>
          </form>
        </PanelBody>
      </Panel>

      <Panel>
        {products.length === 0 ? (
          <EmptyState
            icon={<Smartphone className="size-5" />}
            title={q || status || kind ? 'No matching products' : 'No products yet'}
            description={q || status || kind ? 'Try adjusting your filters.' : 'Add your first product to get started.'}
            action={<ButtonLink href="/admin/products/new" size="md" icon={<Plus className="size-4" />}>Add product</ButtonLink>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left" role="table">
                <thead>
                  <tr className="border-b border-line text-xs font-medium text-ink-3 uppercase tracking-wider">
                    <th className="px-5 py-3 w-20"></th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Brand</th>
                    <th className="px-5 py-3 hidden md:table-cell">Category</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Kind</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 tabular hidden sm:table-cell">Price</th>
                    <th className="px-5 py-3 tabular hidden md:table-cell">Variants</th>
                    <th className="px-5 py-3 w-32"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.map((product) => {
                    const defaultVariant = product.variants.find((v) => v.isActive);
                    return (
                      <tr key={product.id} className="transition-colors hover:bg-panel-2/60">
                        <td className="px-5 py-4">
                          <div className="size-12 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/10 flex items-center justify-center">
                            <Smartphone className="size-6 text-volt-300" />
                          </div>
                        </td>
                        <td className="px-5 py-4 min-w-0">
                          <Link href={`/admin/products/${product.id}`} className="font-medium text-ink hover:text-volt-300">
                            {product.name}
                          </Link>
                          {product.tagline && <p className="text-xs text-ink-3 truncate">{product.tagline}</p>}
                          <p className="text-xs text-ink-4 font-mono">slug: {product.slug}</p>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell text-sm text-ink-2">{product.brand?.name ?? '—'}</td>
                        <td className="px-5 py-4 hidden md:table-cell text-sm text-ink-2">{product.category?.name ?? '—'}</td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <Badge tone="slate" size="xs">{product.kind}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={product.status === 'active' ? 'emerald' : product.status === 'coming_soon' ? 'violet' : product.status === 'draft' ? 'slate' : 'rose'} size="xs" dot>
                            {product.status.replace('_', ' ')}
                          </Badge>
                          {product.isFeatured && <Badge tone="violet" size="xs" className="ml-1">Featured</Badge>}
                        </td>
                        <td className="px-5 py-4 tabular hidden sm:table-cell text-sm text-ink">
                          {formatINR(defaultVariant?.pricePaise ?? product.pricePaise)}
                        </td>
                        <td className="px-5 py-4 tabular hidden md:table-cell text-xs text-ink-3">
                          {product.variants.filter(v => v.isActive).length} / {product._count.variants}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/admin/products/${product.id}`} className="text-ink-3 hover:text-ink p-1.5 rounded" title="Edit">
                              <Edit className="size-4" />
                            </Link>
                            <Link href={`/admin/products/${product.id}/variants`} className="text-ink-3 hover:text-ink p-1.5 rounded" title="Variants">
                              <Tag className="size-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <PanelFooter className="flex items-center justify-between">
                <p className="text-sm text-ink-3">Showing {(pageNum - 1) * pageSize + 1}–{Math.min(pageNum * pageSize, total)} of {total}</p>
                <div className="flex items-center gap-2">
                  {pageNum > 1 && (
                    <ButtonLink href={`/admin/products?${new URLSearchParams({ status, kind, q, page: String(pageNum - 1) } as Record<string, string>).toString()}`} variant="outline" size="sm">Prev</ButtonLink>
                  )}
                  {pageNum < totalPages && (
                    <ButtonLink href={`/admin/products?${new URLSearchParams({ status, kind, q, page: String(pageNum + 1) } as Record<string, string>).toString()}`} variant="primary" size="sm">Next</ButtonLink>
                  )}
                </div>
              </PanelFooter>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}