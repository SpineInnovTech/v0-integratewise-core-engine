/**
 * Type declarations for external npm packages
 * Used by IntegrateWise web app when packages don't provide type definitions
 * or for custom module declaration overrides
 */

// ============================================================================
// Window globals (analytics, etc.)
// ============================================================================
interface Window {
  gtag?: (...args: any[]) => void;
}

// ============================================================================
// SWR - Data fetching library
// ============================================================================
declare module "swr" {
  export default function useSWR<Data = any, Error = any>(
    key: string | null | (() => string | null),
    fetcher?: (...args: any[]) => Promise<Data>,
    options?: {
      revalidateOnFocus?: boolean;
      revalidateOnReconnect?: boolean;
      refreshInterval?: number;
      dedupingInterval?: number;
      focusThrottleInterval?: number;
      errorRetryInterval?: number;
      errorRetryCount?: number;
      shouldRetryOnError?: boolean;
      shouldRetryOnReconnect?: boolean;
      compare?: (a: Data, b: Data) => boolean;
      onSuccess?: (data: Data) => void;
      onError?: (error: Error) => void;
      onErrorRetry?: (
        error: Error,
        key: string,
        config: any,
        revalidate: any,
        retryCount: number
      ) => void;
      [key: string]: any;
    }
  ): {
    data: Data | undefined;
    error: Error | undefined;
    isLoading: boolean;
    isValidating: boolean;
    mutate: (
      data?: Data | Promise<Data> | ((currentData: Data | undefined) => Data),
      shouldRevalidate?: boolean
    ) => Promise<Data | undefined>;
  };

  export function useSWRConfig(): {
    mutate: (key: string | any[], data?: any, shouldRevalidate?: boolean) => Promise<any>;
    cache: Map<any, any>;
  };

  export function mutate(key: string | any[], data?: any, shouldRevalidate?: boolean): Promise<any>;
}

// ============================================================================
// PapaParse - CSV parsing library
// ============================================================================
declare module "papaparse" {
  export interface ParseResult<T = any> {
    data: T[];
    errors: Array<{ type: string; code: string; message: string; row: number }>;
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
      [key: string]: any;
    };
  }

  export interface ParseConfig {
    delimiter?: string;
    header?: boolean;
    header?: string[];
    skipEmptyLines?: boolean | "greedy";
    dynamicTyping?: boolean | ((field: string | number) => boolean);
    transformHeader?: (h: string, index: number) => string;
    transform?: (value: string, field: string | number) => any;
    step?: (row: any) => void;
    complete?: (results: ParseResult) => void;
    error?: (error: { type: string; code: string; message: string }, file: File) => void;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    download?: boolean;
    url?: string;
    [key: string]: any;
  }

  export interface UnparseConfig {
    quotes?: boolean | boolean[];
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
    skipEmptyLines?: boolean | "greedy";
    columns?: string[];
    [key: string]: any;
  }

  export function parse<T = any>(input: string | File, config?: ParseConfig): ParseResult<T>;
  export function unparse(
    data: any[] | { fields: string[]; data: any[] },
    config?: UnparseConfig
  ): string;
  export function unparseMethods(): {
    parse: (input: string | File, config?: ParseConfig) => ParseResult;
    unparse: (data: any[], config?: UnparseConfig) => string;
  };
}

// ============================================================================
// next-themes - Theme management
// ============================================================================
declare module "next-themes" {
  import { ReactNode } from "react";

  export interface UseThemeProps {
    forcedTheme?: string;
    disableTransitionOnChange?: boolean;
    defaultTheme?: string;
    storageKey?: string;
  }

  export interface UseThemeReturn {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    resolvedTheme: string | undefined;
    themes: string[];
    systemTheme: string | undefined;
    forcedTheme: string | undefined;
  }

  export function useTheme(props?: UseThemeProps): UseThemeReturn;

  export interface ThemeProviderProps extends UseThemeProps {
    children: ReactNode;
    attribute?: string | "class" | "data-theme" | "data-mode";
    enableSystem?: boolean;
    enableColorScheme?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
    defaultTheme?: string;
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
}

// ============================================================================
// react-markdown - Markdown rendering (NOT installed in this project)
// ============================================================================
declare module "react-markdown" {
  import { ComponentType, ReactNode, DetailedHTMLProps, HTMLAttributes } from "react";

  export interface ReactMarkdownProps {
    children: string;
    className?: string;
    remarkPlugins?: any[];
    rehypePlugins?: any[];
    components?: Record<string, ComponentType<any>>;
    skipHtml?: boolean;
    transformLinkUri?: ((uri: string) => string) | null | false;
    transformImageUri?: ((uri: string) => string) | null | false;
    linkTarget?: string | ((url: string, text: string, title: string | null) => string);
    disallowedElements?: string[];
    allowedElements?: string[];
    allowElement?: ((element: any) => boolean) | null;
    unwrapDisallowed?: boolean;
  }

  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
}

// ============================================================================
// remark-gfm - GitHub Flavored Markdown plugin
// ============================================================================
declare module "remark-gfm" {
  const remarkGfm: any;
  export default remarkGfm;
}

// ============================================================================
// Custom module overrides and aliases
// ============================================================================

/**
 * @iw/ui/Button - IntegrateWise UI Button component
 * Maps to local components/ui/button.tsx
 * This resolves import { Button } from '@iw/ui/Button'
 */
declare module "@iw/ui/Button" {
  import { ComponentType, ButtonHTMLAttributes, ReactNode } from "react";

  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link"
      | "premium"
      | "success"
      | "warning";
    size?: "default" | "sm" | "lg" | "icon" | "xs";
    asChild?: boolean;
    children?: ReactNode;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
  }

  export const Button: ComponentType<ButtonProps>;
}

/**
 * @integratewise/types/billing - Billing types and interfaces
 * Re-exports from the packages/types/src/billing.ts module
 */
declare module "@integratewise/types/billing" {
  export enum BillingType {
    SUBSCRIPTION = "subscription",
    METERED = "metered",
    HYBRID = "hybrid",
  }

  export enum BillingInterval {
    MONTHLY = "monthly",
    YEARLY = "yearly",
    QUARTERLY = "quarterly",
  }

  export interface SKU {
    id: string;
    name: string;
    description?: string;
    price: number;
    billing_type: BillingType;
    billing_interval?: BillingInterval;
    currency?: string;
    features?: string[];
    limits?: Record<string, number>;
    status: "active" | "deprecated" | "archived";
    created_at?: string;
    updated_at?: string;
  }

  export interface ListPlansResponse {
    plans: SKU[];
    total?: number;
    page?: number;
    pageSize?: number;
  }

  export interface CheckoutRequest {
    sku_id: string;
    gateway: "stripe" | "razorpay";
    success_url?: string;
    cancel_url?: string;
    quantity?: number;
    metadata?: Record<string, any>;
  }

  export interface CheckoutResponse {
    id: string;
    status: "pending" | "completed" | "expired";
    checkout_url?: string;
    order_id?: string;
    key_id?: string;
    amount?: number;
    currency?: string;
    created_at?: string;
    expires_at?: string;
  }

  export interface Subscription {
    id: string;
    tenant_id: string;
    plan_id: string;
    sku_id: string;
    status: "active" | "paused" | "cancelled" | "expired";
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    cancelled_at?: string;
    trial_ends_at?: string;
    created_at?: string;
    updated_at?: string;
  }

  export interface GetSubscriptionResponse {
    subscription: Subscription;
  }

  export interface ListSubscriptionsResponse {
    subscriptions: Subscription[];
    total?: number;
  }

  export interface UsageRecord {
    id: string;
    tenant_id: string;
    metric_key: string;
    value: number;
    unit?: string;
    period?: string;
    metadata?: Record<string, any>;
    recorded_at?: string;
  }

  export interface Entitlements {
    tenant_id: string;
    plan_id?: string;
    sku_id?: string;
    features: Record<string, boolean>;
    limits: Record<string, { limit: number; used: number; remaining: number }>;
    usage: Record<string, UsageRecord[]>;
    status: "active" | "limited" | "exceeded" | "expired";
    effective_from?: string;
    effective_until?: string;
  }

  export interface BillingErrorResponse {
    error: string;
    code?: string;
    details?: Record<string, any>;
    timestamp?: string;
  }

  export interface Invoice {
    id: string;
    tenant_id: string;
    subscription_id?: string;
    amount: number;
    currency: string;
    status: "draft" | "sent" | "paid" | "uncollectible" | "void";
    invoice_date?: string;
    due_date?: string;
    paid_at?: string;
    pdf_url?: string;
    created_at?: string;
    updated_at?: string;
  }

  export interface UsageMetric {
    key: string;
    name: string;
    unit: string;
    description?: string;
    category?: string;
    billable: boolean;
  }
}
