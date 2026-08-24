import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getReviewableOrders, getMyReviews } from '@/lib/services/orders';
import { formatDate } from '@/lib/utils';
import { ReviewsClient } from './ReviewsClient';

export const metadata: Metadata = { title: 'Reviews' };

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/reviews');

  const [reviewable, myReviews] = await Promise.all([
    getReviewableOrders(user.id),
    getMyReviews(user.id),
  ]);

  return <ReviewsClient initialReviewable={reviewable} initialMyReviews={myReviews} />;
}