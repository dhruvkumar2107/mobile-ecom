'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { formatINR } from '@/lib/money';

interface Variant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  ramGb: number | null;
  storageGb: number | null;
  mrpPaise: number;
  pricePaise: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: { name: string };
  category: { name: string };
  mrpPaise: number;
  pricePaise: number;
  variants: Variant[];
}

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ mrpPaise: number; pricePaise: number }>({ mrpPaise: 0, pricePaise: 0 });

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/admin/products/${id}`)
        .then(r => r.json())
        .then(data => {
          setProduct(data.product);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  const handleSaveVariant = async (variantId: string) => {
    if (!product) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/products/${product.id}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setProduct(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          variants: prev.variants.map(v =>
            v.id === variantId ? { ...v, mrpPaise: editForm.mrpPaise, pricePaise: editForm.pricePaise } : v
          ),
        };
      });
      setEditingVariant(null);
    } catch (e) {
      console.error('Failed to save variant:', e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>Product not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <a href="/admin/products" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', textDecoration: 'none' }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
          Products
        </a>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', margin: 0 }}>
          {product.name}
        </h1>
      </div>

      {/* Product Info */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Brand</label>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>{product.brand.name}</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Category</label>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>{product.category.name}</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Base MRP</label>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>{formatINR(product.mrpPaise)}</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Base Price</label>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>{formatINR(product.pricePaise)}</p>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Variants ({product.variants.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>SKU</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Color</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>RAM</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Storage</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>MRP</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Discount</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map(variant => {
                const isEditing = editingVariant === variant.id;
                const discount = variant.mrpPaise > 0 ? Math.round(((variant.mrpPaise - variant.pricePaise) / variant.mrpPaise) * 100) : 0;
                return (
                  <tr key={variant.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#333' }}>{variant.sku}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: variant.colorHex, border: '1px solid #ddd' }} />
                        <span style={{ fontSize: '13px', color: '#333' }}>{variant.colorName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#333' }}>{variant.ramGb ? `${variant.ramGb}GB` : '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#333' }}>{variant.storageGb ? `${variant.storageGb >= 1000 ? `${variant.storageGb/1000}TB` : `${variant.storageGb}GB`}` : '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.mrpPaise}
                          onChange={e => setEditForm(prev => ({ ...prev, mrpPaise: Number(e.target.value) }))}
                          style={{ width: '100px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'right', fontSize: '13px' }}
                        />
                      ) : (
                        <span style={{ color: '#333' }}>{formatINR(variant.mrpPaise)}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.pricePaise}
                          onChange={e => setEditForm(prev => ({ ...prev, pricePaise: Number(e.target.value) }))}
                          style={{ width: '100px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'right', fontSize: '13px' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: '#2874F0' }}>{formatINR(variant.pricePaise)}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: discount > 0 ? '#E8F5E9' : '#F3F4F6',
                        color: discount > 0 ? '#26A541' : '#666',
                      }}>
                        {discount > 0 ? `${discount}% off` : 'No discount'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSaveVariant(variant.id)}
                            disabled={saving}
                            style={{
                              padding: '6px 12px', border: 'none', borderRadius: '6px',
                              background: '#2874F0', color: 'white', fontSize: '12px', fontWeight: 600,
                              cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            <Check style={{ width: 14, height: 14 }} /> Save
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingVariant(null)}
                            style={{
                              padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px',
                              background: 'white', color: '#666', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            <X style={{ width: 14, height: 14 }} /> Cancel
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEditingVariant(variant.id);
                            setEditForm({ mrpPaise: variant.mrpPaise, pricePaise: variant.pricePaise });
                          }}
                          style={{
                            padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px',
                            background: 'white', color: '#333', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Edit2 style={{ width: 14, height: 14 }} /> Edit
                        </motion.button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
