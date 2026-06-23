/**
 * Shim: next/link → react-router v7 Link
 *
 * Maps Next.js <Link> to React Router <Link>.
 * Supports href prop (Next.js style) mapping to "to" prop (React Router style).
 */

import React from "react";
import { Link as RouterLink } from "react-router";

interface NextLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  children?: React.ReactNode;
}

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, prefetch, replace, scroll, children, ...rest }, ref) => {
    // External links: use normal anchor
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return (
        <a href={href} ref={ref} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink to={href} replace={replace} ref={ref} {...rest}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = "Link";

export default Link;
