export type BrandRailProps = {
  brands: Array<{
    id: string;
    name: string;
    slug: string;
    accent: string;
    productCount: number;
  }>;
  limit?: number;
};

export type CategoryGridProps = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    productCount: number;
  }>;
};

export type FlashSaleCountdownProps = {
  sale: {
    id: string;
    name: string;
    endsAt: Date;
    items: Array<{
      id: string;
      slug: string;
      name: string;
      tagline: string | null;
      kind: string;
      status: string;
      brand: { id: string; name: string; slug: string; accent: string };
      category: { id: string; name: string; slug: string };
      heroGradient: string;
      badges: string[];
      highlights: string[];
      ratingAvg: number;
      reviewCount: number;
      soldCount: number;
      mrpPaise: number;
      pricePaise: number;
      finalPaise: number;
      discountPaise: number;
      discountPercent: number;
      flashSale: { id: string; endsAt: Date; name: string } | null;
      keySpecs: Array<{ key: string; label: string; value: string; unit: string | null; groupName: string }>;
      colors: Array<{ name: string; hex: string; hex2: string | null; finish: string | null }>;
      ramOptions: number[];
      storageOptions: number[];
      variantCount: number;
      defaultVariantId: string;
      sellable: number;
      inStock: boolean;
      isPreorder: boolean;
      launchDate: Date | null;
      preorderReleaseAt: Date | null;
      lowestEmiPaise: number | null;
      createdAt: Date;
    }>;
  } | null;
  items: Array<{
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    kind: string;
    status: string;
    brand: { id: string; name: string; slug: string; accent: string };
    category: { id: string; name: string; slug: string };
    heroGradient: string;
    badges: string[];
    highlights: string[];
    ratingAvg: number;
    reviewCount: number;
    soldCount: number;
    mrpPaise: number;
    pricePaise: number;
    finalPaise: number;
    discountPaise: number;
    discountPercent: number;
    flashSale: { id: string; endsAt: Date; name: string } | null;
    keySpecs: Array<{ key: string; label: string; value: string; unit: string | null; groupName: string }>;
    colors: Array<{ name: string; hex: string; hex2: string | null; finish: string | null }>;
    ramOptions: number[];
    storageOptions: number[];
    variantCount: number;
    defaultVariantId: string;
    sellable: number;
    inStock: boolean;
    isPreorder: boolean;
    launchDate: Date | null;
    preorderReleaseAt: Date | null;
    lowestEmiPaise: number | null;
    createdAt: Date;
  }>;
};