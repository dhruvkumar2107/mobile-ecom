'use client';

import { useState } from 'react';
import { Star, Edit, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

type ReviewableItem = {
  orderItemId: string;
  orderId: string;
  orderNo: string;
  productId: string;
  productName: string;
  brandName: string;
  variantLabel: string;
  imageGradient: string;
};

type MyReview = {
  id: string;
  productId: string;
  product: { name: string; brand: { name: string } } | null;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  createdAt: Date;
};

type ReviewsClientProps = {
  initialReviewable: ReviewableItem[];
  initialMyReviews: MyReview[];
};

export function ReviewsClient({ initialReviewable, initialMyReviews }: ReviewsClientProps) {
  const toast = useToast();
  const [reviewable, setReviewable] = useState(initialReviewable);
  const [myReviews, setMyReviews] = useState(initialMyReviews);
  const [showWriteModal, setShowWriteModal] = useState<ReviewableItem | null>(null);
  const [showEditModal, setShowEditModal] = useState<MyReview | null>(null);
  const [formData, setFormData] = useState({ rating: 5, title: '', body: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => setFormData({ rating: 5, title: '', body: '' });

  const handleSubmit = async (isEdit = false) => {
    if (formData.rating < 1 || formData.rating > 5) return;
    setIsSubmitting(true);
    try {
      const item = showWriteModal || showEditModal;
      if (!item) return;

      const res = await api('/api/account/reviews', {
        method: isEdit ? 'PATCH' : 'POST',
        json: {
          productId: item.productId,
          orderItemId: 'orderItemId' in item ? item.orderItemId : undefined,
          reviewId: isEdit && 'id' in item ? item.id : undefined,
          rating: formData.rating,
          title: formData.title.trim() || null,
          body: formData.body.trim(),
        },
      });

      if (res.ok) {
        toast.success(isEdit ? 'Review updated' : 'Review submitted');
        if (!isEdit && 'orderItemId' in item) {
          setReviewable((prev) => prev.filter((i) => i.orderItemId !== item.orderItemId));
        }
        // Refresh my reviews
        const refreshed = await api('/api/account/reviews/list');
        if (refreshed.ok) setMyReviews(refreshed.data as MyReview[]);
        setShowWriteModal(null);
        setShowEditModal(null);
        resetForm();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await api(`/api/account/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Review deleted');
        setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Your reviews</h1>
          <p className="mt-1 text-sm text-ink-3">
            Share your experience with the VOLTAGE community. Your review helps others make informed decisions.
          </p>
        </div>
      </div>

      {/* Awaiting review */}
      {reviewable.length > 0 && (
        <Panel>
          <PanelHeader
            title={`Awaiting your review (${reviewable.length})`}
            description="Products from your delivered orders that you haven't reviewed yet."
            icon={<ShieldCheck className="size-4" />}
          />
          <PanelBody className="p-5 pt-0 space-y-4">
            {reviewable.map((item) => (
              <div key={item.orderItemId} className="flex items-center gap-4 py-3 border-t border-line first:border-0 first:pt-0">
                <div className="size-14 shrink-0 rounded-lg ring-1 ring-inset ring-line" style={{ background: item.imageGradient }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.brandName} {item.productName}</p>
                  <p className="text-xs text-ink-3 truncate">{item.variantLabel}</p>
                  <p className="tabular text-xs text-ink-4">Order: {item.orderNo}</p>
                </div>
                <Button size="sm" onClick={() => { setShowWriteModal(item); resetForm(); }}>
                  <Star className="size-3.5 mr-1.5" aria-hidden />
                  Write review
                </Button>
              </div>
            ))}
          </PanelBody>
        </Panel>
      )}

      {/* My reviews */}
      <Panel>
        <PanelHeader title="Your reviews" icon={<Star className="size-4" />} />
        {myReviews.length === 0 ? (
          <EmptyState
            icon={<Star className="size-5" />}
            title="No reviews yet"
            description="Your submitted reviews will appear here. Reviews go through moderation before appearing on the product page."
          />
        ) : (
          <PanelBody className="p-5 pt-0 space-y-4">
            {myReviews.map((review) => (
              <div key={review.id} className="space-y-3 py-3 border-t border-line first:border-0 first:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-ink truncate">{review.product?.brand?.name} {review.product?.name}</p>
                      <Badge tone={review.status === 'approved' ? 'emerald' : review.status === 'rejected' ? 'rose' : 'amber'} size="sm" dot>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </Badge>
                    </div>
                    {review.title && <p className="mt-1 text-sm font-medium text-ink">{review.title}</p>}
                    <p className="mt-1 text-sm text-ink-2 line-clamp-2">{review.body}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('size-4', i < review.rating ? 'fill-volt-300 text-volt-300' : 'text-ink-3')} />
                      ))}
                      <span className="tabular text-xs text-ink-4">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {review.status !== 'rejected' && (
                      <Button variant="ghost" size="sm" onClick={() => { setShowEditModal(review); setFormData({ rating: review.rating, title: review.title ?? '', body: review.body }); }}>
                        <Edit className="size-3.5 mr-1.5" aria-hidden />
                        Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(review.id)} className="text-rose-400 hover:bg-rose-400/10">
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </PanelBody>
        )}
      </Panel>

      {/* Write review modal */}
      <Modal open={!!showWriteModal} onClose={() => { setShowWriteModal(null); resetForm(); }} title="Write a review">
        <ReviewForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={() => { setShowWriteModal(null); resetForm(); }} />
      </Modal>

      {/* Edit review modal */}
      <Modal open={!!showEditModal} onClose={() => { setShowEditModal(null); resetForm(); }} title="Edit review">
        <ReviewForm formData={formData} setFormData={setFormData} onSubmit={() => handleSubmit(true)} isSubmitting={isSubmitting} onCancel={() => { setShowEditModal(null); resetForm(); }} />
      </Modal>
    </div>
  );
}

function ReviewForm({ formData, setFormData, onSubmit, isSubmitting, onCancel }: { formData: { rating: number; title: string; body: string }; setFormData: React.Dispatch<React.SetStateAction<{ rating: number; title: string; body: string }>>; onSubmit: () => void; isSubmitting: boolean; onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-2">Your rating</label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={formData.rating === star}
              onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
              className={cn('p-1', formData.rating >= star ? 'text-volt-300' : 'text-ink-3')}
            >
              <Star className="size-6" aria-hidden={true} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-ink mb-1">Title (optional)</label>
        <input
          id="review-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Summarise your experience in a few words"
          className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-volt-400"
          maxLength={100}
        />
      </div>
      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-ink mb-1">Your experience</label>
        <Textarea
          id="review-body"
          value={formData.body}
          onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
          placeholder="What did you like? What could be better? Be specific — it helps others."
          rows={4}
          className="w-full"
          maxLength={2000}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSubmit} loading={isSubmitting} disabled={isSubmitting || formData.rating < 1}>
          {formData.rating < 1 ? 'Select a rating' : 'Submit review'}
        </Button>
      </div>
    </div>
  );
}