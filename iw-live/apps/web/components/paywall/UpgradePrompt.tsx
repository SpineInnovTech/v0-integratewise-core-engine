'use client';

import { ENTITLEMENT_KEYS } from '@/lib/billing/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  entitlementKey: keyof typeof ENTITLEMENT_KEYS;
  title?: string;
  description?: string;
  feature?: string;
}

const ENTITLEMENT_MESSAGES: Record<string, { title: string; description: string; icon: any }> = {
  MAX_WORKFLOWS: {
    title: 'Unlock Unlimited Workflows',
    description: 'Create as many workflows as you need to automate your business processes.',
    icon: Zap,
  },
  MAX_INTEGRATIONS: {
    title: 'Connect More Integrations',
    description: 'Integrate with all your favorite tools and services.',
    icon: Sparkles,
  },
  RAG_QUOTA_TOKENS_MONTH: {
    title: 'More AI Power',
    description: 'Get more AI tokens to power your workflows and insights.',
    icon: TrendingUp,
  },
  ANALYTICS_LEVEL: {
    title: 'Advanced Analytics',
    description: 'Unlock advanced analytics and insights for your business.',
    icon: TrendingUp,
  },
  API_ACCESS: {
    title: 'API Access',
    description: 'Access our powerful API to build custom integrations.',
    icon: Shield,
  },
  WEBHOOKS_ENABLED: {
    title: 'Webhook Support',
    description: 'Receive real-time updates via webhooks.',
    icon: Zap,
  },
};

/**
 * UpgradePrompt - Warm, friendly upgrade prompt component
 * 
 * Features:
 * - Low-friction design
 * - Clear value proposition
 * - Zero-anxiety messaging
 * - Direct upgrade CTA
 */
export function UpgradePrompt({
  entitlementKey,
  title,
  description,
  feature,
}: UpgradePromptProps) {
  const messages = ENTITLEMENT_MESSAGES[entitlementKey] || {
    title: title || 'Upgrade to Unlock This Feature',
    description: description || 'Get access to this and more with a Pro plan.',
    icon: Sparkles,
  };

  const Icon = messages.icon;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{messages.title}</CardTitle>
        <CardDescription className="text-base mt-2">
          {messages.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing?compare=true">Compare Plans</Link>
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          No credit card required for trial • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}
