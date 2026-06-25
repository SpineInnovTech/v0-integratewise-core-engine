# Billing & Entitlement Examples

This document shows how to use the billing system and enforce entitlements across your application.

## Server-Side Examples

### 1. Protect API Route with Entitlement

\`\`\`typescript
// app/api/workflows/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EntitlementEnforcement, ENTITLEMENT_KEYS } from '@/lib/billing';

export async function POST(request: NextRequest) {
  const org_id = 'your-org-id'; // Get from session/auth
  
  // Check if API access is enabled
  await EntitlementEnforcement.requireEntitlement(
    org_id,
    ENTITLEMENT_KEYS.API_ACCESS
  );
  
  // Proceed with creating workflow
  // ...
  
  return NextResponse.json({ success: true });
}
\`\`\`

### 2. Check Usage Limits Before Creating Resource

\`\`\`typescript
// app/api/workflows/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EntitlementEnforcement, ENTITLEMENT_KEYS, EntitlementError } from '@/lib/billing';

export async function POST(request: NextRequest) {
  const org_id = 'your-org-id';
  
  // Get current workflow count
  const currentCount = await getWorkflowCount(org_id);
  
  try {
    // Check if within limit
    await EntitlementEnforcement.requireWithinLimit(
      org_id,
      ENTITLEMENT_KEYS.MAX_WORKFLOWS,
      currentCount
    );
    
    // Create workflow
    // ...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof EntitlementError) {
      return NextResponse.json(error.toJSON(), { status: 403 });
    }
    throw error;
  }
}
\`\`\`

### 3. Using Middleware Helpers

\`\`\`typescript
// app/api/integrations/custom/route.ts
import { NextRequest } from 'next/server';
import { withEntitlement, ENTITLEMENT_KEYS } from '@/lib/billing';

export async function POST(request: NextRequest) {
  const org_id = 'your-org-id';
  
  return withEntitlement(
    org_id,
    ENTITLEMENT_KEYS.CUSTOM_INTEGRATIONS,
    async () => {
      // Create custom integration
      // ...
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  );
}
\`\`\`

### 4. Check Multiple Entitlements

\`\`\`typescript
// app/api/analytics/advanced/route.ts
import { EntitlementEnforcement, ENTITLEMENT_KEYS } from '@/lib/billing';

export async function GET(request: Request) {
  const org_id = 'your-org-id';
  
  // Get analytics level
  const analyticsLevel = await EntitlementEnforcement.getValue(
    org_id,
    ENTITLEMENT_KEYS.ANALYTICS_LEVEL
  );
  
  if (analyticsLevel !== 'advanced' && analyticsLevel !== 'enterprise') {
    return new Response(
      JSON.stringify({
        error: 'Advanced analytics requires Pro or Enterprise plan',
        upgrade_url: '/pricing',
      }),
      { status: 403 }
    );
  }
  
  // Return advanced analytics
  // ...
}
\`\`\`

## Client-Side Examples (React)

### 1. Show Feature Based on Entitlement

\`\`\`typescript
'use client';

import { useEntitlement, ENTITLEMENT_KEYS } from '@/lib/billing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CustomIntegrationButton({ org_id }: { org_id: string }) {
  const { hasEntitlement, loading } = useEntitlement(
    org_id,
    ENTITLEMENT_KEYS.CUSTOM_INTEGRATIONS
  );
  
  if (loading) {
    return <Button disabled>Loading...</Button>;
  }
  
  if (!hasEntitlement) {
    return (
      <div className="flex items-center gap-2">
        <Button disabled>Create Custom Integration</Button>
        <Badge variant="secondary">Pro Plan Required</Badge>
      </div>
    );
  }
  
  return <Button onClick={createIntegration}>Create Custom Integration</Button>;
}
\`\`\`

### 2. Check Usage Limits with Progress Bar

\`\`\`typescript
'use client';

import { useEntitlements, ENTITLEMENT_KEYS } from '@/lib/billing';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';

export function WorkflowLimitDisplay({ org_id, currentCount }: Props) {
  const { checkLimit, loading } = useEntitlements(org_id);
  
  if (loading) return null;
  
  const { allowed, limit, usage, percentage } = checkLimit(
    ENTITLEMENT_KEYS.MAX_WORKFLOWS,
    currentCount
  );
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span>Workflows Used</span>
        <span>{usage} / {limit === Infinity ? 'Unlimited' : limit}</span>
      </div>
      {limit !== Infinity && (
        <Progress value={percentage} />
      )}
      {!allowed && (
        <Alert variant="destructive" className="mt-4">
          You've reached your workflow limit. 
          <a href="/pricing">Upgrade your plan</a> to create more.
        </Alert>
      )}
    </div>
  );
}
\`\`\`

### 3. Subscription Status Display

\`\`\`typescript
'use client';

import { useSubscription } from '@/lib/billing';
import { Badge } from '@/components/ui/badge';

export function SubscriptionBadge({ org_id }: { org_id: string }) {
  const { subscription, isActive, isTrial, isPastDue, loading } = useSubscription(org_id);
  
  if (loading || !subscription) return null;
  
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{subscription.plan.name}</span>
      {isTrial && <Badge variant="secondary">Trial</Badge>}
      {isActive && <Badge variant="default">Active</Badge>}
      {isPastDue && <Badge variant="destructive">Past Due</Badge>}
    </div>
  );
}
\`\`\`

### 4. Plan Comparison with Entitlements

\`\`\`typescript
'use client';

import { usePlans, useEntitlements, ENTITLEMENT_KEYS } from '@/lib/billing';
import { Check, X } from 'lucide-react';

export function PlanComparison({ org_id }: { org_id: string }) {
  const { plans, loading: plansLoading } = usePlans();
  const { getValue } = useEntitlements(org_id);
  
  const currentWorkflowLimit = getValue(ENTITLEMENT_KEYS.MAX_WORKFLOWS);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>{plan.price_cents / 100} {plan.currency}/{plan.interval}</p>
          
          {/* Show features */}
          {plan.features.map(feature => (
            <div key={feature.name}>
              {feature.included ? <Check /> : <X />}
              {feature.name}
            </div>
          ))}
          
          {/* Highlight if this is current plan */}
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
\`\`\`

### 5. Handle Subscription Actions

\`\`\`typescript
'use client';

import { useSubscriptionActions } from '@/lib/billing';
import { Button } from '@/components/ui/button';

export function SubscriptionActions({ org_id }: { org_id: string }) {
  const { changePlan, cancelSubscription, loading, error } = useSubscriptionActions(org_id);
  
  const handleUpgrade = async () => {
    const result = await changePlan('pro-monthly');
    if (result) {
      alert('Plan upgraded successfully!');
    }
  };
  
  const handleCancel = async () => {
    if (!confirm('Are you sure?')) return;
    
    const result = await cancelSubscription(true, 'User requested cancellation');
    if (result) {
      alert('Subscription canceled. Access until end of billing period.');
    }
  };
  
  return (
    <div>
      {error && <div className="text-red-500">{error}</div>}
      
      <Button onClick={handleUpgrade} disabled={loading}>
        Upgrade to Pro
      </Button>
      
      <Button onClick={handleCancel} disabled={loading} variant="outline">
        Cancel Subscription
      </Button>
    </div>
  );
}
\`\`\`

## Integration with Existing Features

### Protect Brainstorming AI Features

\`\`\`typescript
// app/api/brainstorm/analyze/route.ts
import { withLimitCheck, ENTITLEMENT_KEYS } from '@/lib/billing';

export async function POST(request: Request) {
  const org_id = 'your-org-id';
  const { data } = await request.json();
  
  // Calculate token usage
  const estimatedTokens = estimateTokenUsage(data);
  
  // Get current month's usage
  const currentUsage = await getCurrentMonthTokenUsage(org_id);
  
  return withLimitCheck(
    org_id,
    ENTITLEMENT_KEYS.RAG_QUOTA_TOKENS_MONTH,
    currentUsage + estimatedTokens,
    async () => {
      // Process brainstorm request
      // ...
      return new Response(JSON.stringify({ success: true }));
    }
  );
}
\`\`\`

### Gate Normalize Feature

\`\`\`typescript
// app/normalize/page.tsx
'use client';

import { useEntitlement, ENTITLEMENT_KEYS } from '@/lib/billing';
import { Alert } from '@/components/ui/alert';

export default function NormalizePage() {
  const org_id = 'your-org-id';
  const { hasEntitlement, loading } = useEntitlement(
    org_id,
    ENTITLEMENT_KEYS.ANALYTICS_LEVEL
  );
  
  if (loading) return <div>Loading...</div>;
  
  if (!hasEntitlement || hasEntitlement !== 'advanced') {
    return (
      <Alert>
        Normalize requires Pro plan or higher.
        <a href="/pricing">Upgrade now</a>
      </Alert>
    );
  }
  
  return <div>{/* Normalize interface */}</div>;
}
\`\`\`

## Best Practices

1. **Always check entitlements on the server side** for security
2. **Use client-side checks for UX** (hiding buttons, showing upgrade prompts)
3. **Handle EntitlementError gracefully** with clear upgrade CTAs
4. **Cache entitlements** where appropriate to reduce API calls
5. **Show usage progress** before users hit limits
6. **Test with different plan levels** during development
7. **Log entitlement violations** for analytics and debugging
