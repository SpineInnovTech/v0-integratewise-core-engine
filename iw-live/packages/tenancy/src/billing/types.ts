import { z } from "zod";

export type BillingPeriod = "monthly" | "yearly" | "quarterly";

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface BillingCustomer {
  id: string;
  provider_id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: BillingAddress;
  payment_methods?: PaymentMethod[];
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "upi" | "netbanking" | "wallet";
  provider_id: string;
  is_default: boolean;
  details: {
    last4?: string;
    brand?: string;
    vpa?: string; // For UPI
    bank?: string; // For Netbanking
  };
}

export interface PricePlan {
  id: string;
  provider_id: string;
  name: string;
  amount: number;
  currency: string;
  interval: BillingPeriod;
  active: boolean;
  metadata?: Record<string, any>;
}

export interface UnifiedSubscription {
  id: string;
  provider_id: string;
  customer_id: string;
  plan_id: string;
  status: "active" | "past_due" | "canceled" | "incomplete" | "trialing" | "paused";
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface UnifiedInvoice {
  id: string;
  provider_id: string;
  customer_id: string;
  subscription_id?: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  invoice_date: Date;
  due_date: Date;
  pdf_url?: string;
  hosted_url?: string;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

export interface BillingEvent {
  id: string;
  type: string;
  provider: string;
  payload: any;
  created_at: Date;
  processed_at?: Date;
  status: "pending" | "processed" | "failed";
}

export interface CheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  subscription_id?: string;
  status: "open" | "complete" | "expired";
}
