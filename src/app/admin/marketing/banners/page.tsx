'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, GripVertical, Eye, EyeOff } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  gradient: string;
  accent: string;
  placement: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Banner>>({});

  useEffect(() => {
    fetch('/api/admin/banners')
      .then(r => r.json())
      .then(data => {
        setBanners(data.banners || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (id: string) => {
    try {
      await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setBanners(prev => prev.map(b => b.id === id ? { ...b, ...editForm } : b));
      setEditingId(null);
    } catch (e) {
      console.error('Failed to save banner:', e);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.banner) {
        setBanners(prev => [...prev, data.banner]);
        setShowCreate(false);
        setEditForm({});
      }
    } catch (e) {
      console.error('Failed to create banner:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error('Failed to delete banner:', e);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive } : b));
    } catch (e) {
      console.error('Failed to toggle banner:', e);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Loading banners...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', margin: 0 }}>Banners</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>Manage homepage banners and promotions</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setShowCreate(true); setEditForm({}); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: '#2874F0', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus style={{ width: 18, height: 18 }} /> Add Banner
        </motion.button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>Create New Banner</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Title</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Banner title"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Subtitle</label>
              <input
                type="text"
                value={editForm.subtitle || ''}
                onChange={e => setEditForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Banner subtitle"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '6px' }}>CTA Label</label>
              <input
                type="text"
                value={editForm.ctaLabel || ''}
                onChange={e => setEditForm(prev => ({ ...prev, ctaLabel: e.target.value }))}
                placeholder="e.g. Shop Now"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '6px' }}>CTA Link</label>
              <input
                type="text"
                value={editForm.ctaHref || ''}
                onChange={e => setEditForm(prev => ({ ...prev, ctaHref: e.target.value }))}
                placeholder="e.g. /mobile/products"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Gradient</label>
              <input
                type="text"
                value={editForm.gradient || ''}
                onChange={e => setEditForm(prev => ({ ...prev, gradient: e.target.value }))}
                placeholder="CSS gradient"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Accent Color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={editForm.accent || '#2874F0'}
                  onChange={e => setEditForm(prev => ({ ...prev, accent: e.target.value }))}
                  style={{ width: '48px', height: '40px', padding: 0, border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={editForm.accent || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, accent: e.target.value }))}
                  placeholder="#2874F0"
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              disabled={!editForm.title}
              style={{
                padding: '10px 20px', background: editForm.title ? '#2874F0' : '#ccc', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                cursor: editForm.title ? 'pointer' : 'not-allowed',
              }}
            >
              Create Banner
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowCreate(false); setEditForm({}); }}
              style={{
                padding: '10px 20px', background: 'white', color: '#666',
                border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {banners.map(banner => {
          const isEditing = editingId === banner.id;
          return (
            <motion.div
              key={banner.id}
              layout
              style={{
                background: 'white', borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                opacity: banner.isActive ? 1 : 0.6,
              }}
            >
              {/* Banner Preview */}
              <div style={{
                height: '120px',
                background: banner.gradient || banner.accent,
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                position: 'relative',
              }}>
                <div style={{ color: 'white', maxWidth: '60%' }}>
                  {banner.eyebrow && (
                    <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {banner.eyebrow}
                    </span>
                  )}
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>{banner.title}</h3>
                  {banner.subtitle && (
                    <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>{banner.subtitle}</p>
                  )}
                </div>
                {banner.ctaLabel && (
                  <div style={{
                    position: 'absolute', right: '24px',
                    padding: '8px 16px', background: 'white', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 700, color: banner.accent,
                  }}>
                    {banner.ctaLabel}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: banner.isActive ? '#E8F5E9' : '#F3F4F6',
                    color: banner.isActive ? '#26A541' : '#666',
                  }}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    Sort: {banner.sortOrder}
                  </span>
                  {banner.ctaHref && (
                    <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
                      → {banner.ctaHref}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleActive(banner.id, !banner.isActive)}
                    style={{
                      padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px',
                      background: 'white', color: '#666', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    {banner.isActive ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                    {banner.isActive ? 'Hide' : 'Show'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(banner.id)}
                    style={{
                      padding: '6px 12px', border: '1px solid #FECACA', borderRadius: '6px',
                      background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} /> Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {banners.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px' }}>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>No banners yet. Create your first banner!</p>
          </div>
        )}
      </div>
    </div>
  );
}
