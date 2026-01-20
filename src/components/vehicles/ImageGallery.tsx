import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const validImages = images.length > 0 ? images : ['/placeholder.svg'];

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  }, [validImages.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') setIsFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToPrevious, goToNext]);

  return (
    <>
      {/* Main Gallery */}
      <div className={cn('space-y-4', className)}>
        {/* Main Image */}
        <div 
          className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-muted"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={validImages[selectedIndex]}
            alt={`${alt} - Foto ${selectedIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Fullscreen button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-white backdrop-blur-sm">
              <Maximize2 className="h-5 w-5" />
              <span className="text-sm font-medium">Ver em tela cheia</span>
            </div>
          </div>

          {/* Navigation arrows (only if multiple images) */}
          {validImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
              {selectedIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {validImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {validImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  'relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted transition-all duration-200',
                  selectedIndex === idx
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'opacity-70 hover:opacity-100'
                )}
              >
                <img
                  src={img}
                  alt={`${alt} - Miniatura ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Image counter */}
            {validImages.length > 1 && (
              <div className="absolute left-4 top-4 z-50 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                {selectedIndex + 1} / {validImages.length}
              </div>
            )}

            {/* Main fullscreen image */}
            <div className="flex h-full w-full items-center justify-center p-8">
              <img
                src={validImages[selectedIndex]}
                alt={`${alt} - Foto ${selectedIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Navigation arrows */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Thumbnail strip at bottom */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-lg bg-black/50 p-2 backdrop-blur-sm">
                {validImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      'relative h-14 w-20 flex-shrink-0 overflow-hidden rounded transition-all duration-200',
                      selectedIndex === idx
                        ? 'ring-2 ring-white'
                        : 'opacity-50 hover:opacity-100'
                    )}
                  >
                    <img
                      src={img}
                      alt={`${alt} - Miniatura ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
