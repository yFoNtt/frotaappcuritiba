import { useState, useEffect } from 'react';
import { getSignedPhotoUrls } from './useInspections';

/**
 * Hook to resolve inspection photo references (paths or legacy URLs) 
 * into signed URLs for the private inspection-photos bucket.
 */
export function useSignedPhotoUrls(photos: string[] | null | undefined) {
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!photos || photos.length === 0) {
      setSignedUrls([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getSignedPhotoUrls(photos).then((urls) => {
      if (!cancelled) {
        setSignedUrls(urls);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [photos?.join(',')]);

  return { signedUrls, isLoading };
}
