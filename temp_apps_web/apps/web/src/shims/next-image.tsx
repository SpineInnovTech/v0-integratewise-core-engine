/**
 * Shim: next/image → standard <img>
 *
 * Maps Next.js Image component to a standard img element.
 * In Vite/Cloudflare Pages, we don't have Next.js image optimization.
 */

import React from "react";

interface NextImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
}

const Image = React.forwardRef<HTMLImageElement, NextImageProps>(
  ({ fill, priority, quality, placeholder, blurDataURL, unoptimized, ...props }, ref) => {
    const style: React.CSSProperties = fill
      ? {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          ...props.style,
        }
      : props.style || {};

    return <img ref={ref} loading={priority ? "eager" : "lazy"} style={style} {...props} />;
  }
);

Image.displayName = "Image";

export default Image;
