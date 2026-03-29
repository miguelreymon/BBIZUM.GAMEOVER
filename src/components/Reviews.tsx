
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle, Star, ChevronDown } from 'lucide-react';
import ReviewForm from './ReviewForm';
import type { Review } from '@/lib/reviews';
import { siteContent as defaultContent } from '@/lib/content';
import { useConfig } from '@/context/ConfigContext';
import { getImage } from '@/lib/images';


const StarIcon = ({ filled }: { filled: boolean }) => (
  <Star
    className={`w-5 h-5 ${
      filled ? 'text-yellow-400 fill-current' : 'text-gray-300'
    }`}
  />
);

export default function Reviews() {
  const config = useConfig();
  const siteContent = config || defaultContent;
  const initialReviews: Review[] = siteContent.homePage.reviewsSection.reviews;

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleReviewSubmit = (newReview: Review) => {
    setReviews([newReview, ...reviews]);
  };

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold font-headline text-center mb-8">
        {siteContent.homePage.reviewsSection.title}
      </h2>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} filled={true} />
            ))}
          </div>
          <span className="font-bold">{reviews.length} Reseñas</span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Escribe una reseña</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Escribe tu reseña</DialogTitle>
              </DialogHeader>
              <ReviewForm
                onSubmitSuccess={handleReviewSubmit}
                onClose={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-12">
        {/* First 8 reviews in a single column */}
        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {reviews.slice(0, 8).map((review) => (
            <div key={review.id} className="p-6 space-y-4 border rounded-xl bg-card/50 shadow-sm">
              {review.image && (
                <div className="relative w-full aspect-[4/3] sm:aspect-video mb-4">
                  <Image
                    src={getImage(review.image)}
                    alt={`Review by ${review.name}`}
                    fill
                    className="rounded-lg object-cover"
                    data-ai-hint="customer photo"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{review.name}</h3>
                    {review.isVerified && (
                      <span className="flex items-center text-xs text-muted-foreground gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < review.rating} />
                  ))}
                </div>
              </div>
              {review.text && <p className="text-base leading-relaxed italic">&quot;{review.text}&quot;</p>}
            </div>
          ))}
        </div>

        {/* Remaining reviews in 2 columns, no image */}
        {reviews.length > 8 && (
          <div className="pt-12 border-t">
            <h3 className="text-xl font-bold mb-6 text-center">Más valoraciones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {reviews.slice(8).map((review) => (
                <div key={review.id} className="p-5 space-y-3 border rounded-lg bg-card shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{review.name}</h3>
                        {review.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} filled={i < review.rating} />
                      ))}
                    </div>
                  </div>
                  {review.text && <p className="text-sm text-muted-foreground">{review.text}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
