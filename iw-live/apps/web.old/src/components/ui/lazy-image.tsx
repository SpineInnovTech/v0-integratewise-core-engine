import { useState, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Fallback component or src to show while loading */
  fallback?: React.ReactNode;
  /** Blur hash or low-quality image placeholder */
  placeholderSrc?: string;
  /** Aspect ratio to prevent layout shift */
  aspectRatio?: string;
  /** Whether to use blur-up effect */
  blurUp?: boolean;
}

/**
 * LazyImage - Image component with loading states and blur-up effect
 *
 * Features:
 * - Skeleton loading state
 * - Blur-up placeholder effect
 * - Aspect ratio preservation (prevents CLS)
 * - Error handling with fallback
 * - Intersection Observer for lazy loading
 *
 * @example
 * <LazyImage
 *   src="/hero.png"
 *   alt="Hero image"
 *   aspectRatio="16/9"
 *   blurUp
 * />
 */
export function LazyImage({
  src,
  alt,
  fallback,
  placeholderSrc,
  aspectRatio = "16/9",
  blurUp = true,
  className,
  style,
  ...props
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imageRef, setImageRef] = useState<HTMLDivElement | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imageRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px",
        threshold: 0,
      }
    );

    observer.observe(imageRef);
    return () => observer.disconnect();
  }, [imageRef]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div
      ref={setImageRef}
      className={cn("relative overflow-hidden", className)}
      style={{
        aspectRatio,
        ...style,
      }}
    >
      {/* Skeleton loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/5 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Blur placeholder */}
      {blurUp && placeholderSrc && isLoading && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          {fallback || (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-iw-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xs text-iw-text-secondary">Failed to load image</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LazyImage;
