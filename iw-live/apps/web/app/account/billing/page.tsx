'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  FileText,
  TrendingUp,
  Calendar,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { GetSubscriptionResponse, Invoice } from '@/lib/billing/types';

function BillingPageContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<GetSubscriptionResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // TODO: Replace with actual org_id from auth context
  const org_id = 'demo-org-id';

  useEffect(() => {
    fetchBillingData();
    
    // Show success message if redirected from pricing page
    if (searchParams.get('subscription') === 'success') {
      // You could show a toast notification here
      console.log('Subscription started successfully!');
    }
  }, [searchParams]);

  const fetchBillingData = async () => {
    try {
      const [subResponse, invoicesResponse] = await Promise.all([
        fetch(`/api/billing/subscription?org_id=${org_id}`),
        fetch(`/api/billing/invoices?org_id=${org_id}`),
      ]);

      const subData = await subResponse.json();
      const invoicesData = await invoicesResponse.json();

      if (subData.success) {
        setSubscription(subData.data);
      }

      if (invoicesData.success) {
        setInvoices(invoicesData.data);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    // Redirect to pricing page
    window.location.href = '/pricing';
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setActionLoading('cancel');

    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id,
          cancel_at_period_end: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Your subscription has been scheduled for cancellation at the end of the billing period.');
        fetchBillingData();
      } else {
        alert(`Failed to cancel: ${data.error}`);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (priceCents: number, currency: string) => {
    const price = priceCents / 100;
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    return `${currencySymbol}${price.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      trial: { variant: 'secondary', label: 'Trial' },
      active: { variant: 'default', label: 'Active' },
      past_due: { variant: 'destructive', label: 'Past Due' },
      canceled: { variant: 'outline', label: 'Canceled' },
    };

    const config = variants[status] || { variant: 'outline' as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: 'outline', label: 'Draft' },
      open: { variant: 'secondary', label: 'Open' },
      paid: { variant: 'default', label: 'Paid' },
      void: { variant: 'destructive', label: 'Void' },
    };

    const config = variants[status] || { variant: 'outline' as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUsagePercentage = (key: string, value: number) => {
    // Mock usage data - in production, fetch from your analytics
    const usageMap: Record<string, { used: number; limit: number }> = {
      max_workflows: { used: 3, limit: value },
      max_integrations: { used: 2, limit: value },
      rag_quota_tokens_month: { used: 450, limit: value },
    };

    const usage = usageMap[key];
    if (!usage) return 0;

    return Math.min((usage.used / usage.limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-12 text-center max-w-2xl mx-auto">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Active Subscription</h2>
          <p className="text-muted-foreground mb-6">
            You don't have an active subscription yet. Choose a plan to get started.
          </p>
          <Button onClick={() => (window.location.href = '/pricing')}>
            View Pricing Plans
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription, invoices, and payment methods
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Subscription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{subscription.plan.name}</span>
                    {getStatusBadge(subscription.subscription.status)}
                  </div>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>

              <p className="text-muted-foreground mb-6">
                {subscription.plan.description}
              </p>

              <Separator className="mb-6" />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
                  <p className="font-semibold capitalize">{subscription.plan.interval}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="font-semibold">
                    {formatPrice(subscription.plan.price_cents, subscription.plan.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Period</p>
                  <p className="font-semibold text-sm">
                    {formatDate(subscription.subscription.current_period_start)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Renews On</p>
                  <p className="font-semibold text-sm">
                    {formatDate(subscription.subscription.current_period_end)}
                  </p>
                </div>
              </div>

              {subscription.subscription.status === 'trial' &&
                subscription.subscription.trial_end && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Trial Period Active</p>
                        <p className="text-sm text-muted-foreground">
                          Your trial ends on {formatDate(subscription.subscription.trial_end)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {subscription.subscription.cancel_at && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Cancellation Scheduled</p>
                      <p className="text-sm text-muted-foreground">
                        Your subscription will be canceled on{' '}
                        {formatDate(subscription.subscription.cancel_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleChangePlan} variant="default">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
                {!subscription.subscription.cancel_at && (
                  <Button
                    onClick={handleCancelSubscription}
                    variant="outline"
                    disabled={actionLoading === 'cancel'}
                  >
                    {actionLoading === 'cancel' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </Button>
                )}
              </div>
            </Card>

            {/* Usage & Limits */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Usage & Limits</h2>
              <div className="space-y-4">
                {Object.entries(subscription.entitlements).map(([key, value]) => {
                  // Only show countable entitlements
                  if (
                    !['max_workflows', 'max_integrations', 'rag_quota_tokens_month'].includes(key)
                  ) {
                    return null;
                  }

                  const labels: Record<string, string> = {
                    max_workflows: 'Workflows',
                    max_integrations: 'Integrations',
                    rag_quota_tokens_month: 'AI Tokens (Monthly)',
                  };

                  const numValue = typeof value === 'number' ? value : 0;
                  const percentage = getUsagePercentage(key, numValue);
                  const isUnlimited = numValue >= 999999;

                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{labels[key]}</span>
                        <span className="text-sm text-muted-foreground">
                          {isUnlimited ? 'Unlimited' : `${numValue} limit`}
                        </span>
                      </div>
                      {!isUnlimited && (
                        <Progress value={percentage} className="h-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Invoices */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Invoice History</h2>
                <Button variant="ghost" size="sm" onClick={fetchBillingData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {formatPrice(invoice.amount_cents, invoice.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invoice.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getInvoiceStatusBadge(invoice.status)}
                        {invoice.status === 'paid' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Quick Actions & Features */}
          <div className="space-y-6">
            {/* Active Features */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Active Features</h3>
              <div className="space-y-3">
                {subscription.plan.features
                  .filter((f) => f.included)
                  .slice(0, 6)
                  .map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = '/pricing')}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  View All Plans
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => alert('Payment method management coming soon')}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => alert('Billing contact update coming soon')}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Update Billing Info
                </Button>
              </div>
            </Card>

            {/* Support */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our billing support team is here to assist you with any questions.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  );
}
