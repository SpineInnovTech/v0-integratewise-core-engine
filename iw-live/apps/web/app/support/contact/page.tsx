'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, FileText, Download, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * SUPPORT-026: Support Tools
 * 
 * Features:
 * - Contact Support form with prefilled context
 * - Attach context snapshot (safe metadata)
 * - Optional logs export
 * - Email-based workflow
 */

interface ContextSnapshot {
  workspaceId: string | null;
  userId: string | null;
  currentPage: string;
  userAgent: string;
  timestamp: string;
  metadata: {
    subscription?: any;
    recentActions?: string[];
    errors?: string[];
  };
}

export default function SupportContactPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
    email: '',
  });

  // Capture context snapshot
  const captureContextSnapshot = async (): Promise<ContextSnapshot> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get workspace ID from URL or localStorage
    const workspaceId = typeof window !== 'undefined' 
      ? localStorage.getItem('workspace_id') 
      : null;

    // Get subscription info (safe metadata only)
    let subscription = null;
    if (workspaceId) {
      try {
        const response = await fetch(`/api/billing/subscription?org_id=${workspaceId}`);
        const data = await response.json();
        if (data.success) {
          subscription = {
            plan: data.data.plan.name,
            status: data.data.subscription.status,
          };
        }
      } catch (e) {
        // Ignore errors
      }
    }

    return {
      workspaceId,
      userId: user?.id || null,
      currentPage: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      metadata: {
        subscription,
        recentActions: [], // Could track recent actions
        errors: [], // Could capture recent errors
      },
    };
  };

  // Export logs (if user consents)
  const exportLogs = async (): Promise<string> => {
    if (typeof window === 'undefined') return '';

    const logs: string[] = [];
    
    // Capture console errors (if available)
    if (window.console && (window.console as any).logs) {
      logs.push(...(window.console as any).logs.slice(-50));
    }

    // Add context snapshot
    const snapshot = await captureContextSnapshot();
    logs.push('\n--- Context Snapshot ---');
    logs.push(JSON.stringify(snapshot, null, 2));

    return logs.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to contact support');
        router.push('/login');
        return;
      }

      // Capture context snapshot
      const contextSnapshot = includeContext ? await captureContextSnapshot() : null;
      const logs = includeLogs ? await exportLogs() : null;

      // Prepare email body
      let emailBody = `Subject: ${formData.subject}\n\n`;
      emailBody += `Category: ${formData.category}\n`;
      emailBody += `Priority: ${formData.priority}\n\n`;
      emailBody += `Message:\n${formData.message}\n\n`;

      if (contextSnapshot) {
        emailBody += `--- Context Snapshot ---\n`;
        emailBody += JSON.stringify(contextSnapshot, null, 2);
        emailBody += `\n\n`;
      }

      if (logs) {
        emailBody += `--- Logs ---\n${logs}\n`;
      }

      // Create mailto link with prefilled email
      const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@integratewise.co';
      const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(emailBody)}`;

      // Open email client
      window.location.href = mailtoLink;

      // Also send to API for tracking (optional)
      try {
        await fetch('/api/support/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: formData.subject,
            category: formData.category,
            priority: formData.priority,
            message: formData.message,
            email: formData.email || user.email,
            contextSnapshot: includeContext ? contextSnapshot : null,
            includeLogs,
          }),
        });
      } catch (apiError) {
        // Non-blocking - email client already opened
        console.warn('Failed to log support request:', apiError);
      }

      toast.success('Email client opened. Please send the email to complete your support request.');
      
      // Reset form after delay
      setTimeout(() => {
        setFormData({
          subject: '',
          category: '',
          priority: 'medium',
          message: '',
          email: '',
        });
        setIncludeContext(true);
        setIncludeLogs(false);
      }, 2000);
    } catch (error: any) {
      toast.error(`Failed to prepare support request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Support
          </CardTitle>
          <CardDescription>
            We're here to help! Fill out the form below and we'll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="integration">Integration Help</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your issue or question in detail..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use your account email
              </p>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="include-context"
                  checked={includeContext}
                  onCheckedChange={(checked) => setIncludeContext(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="include-context" className="cursor-pointer">
                    Include context snapshot
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically attach workspace info, current page, and subscription details to help us assist you faster
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="include-logs"
                  checked={includeLogs}
                  onCheckedChange={(checked) => setIncludeLogs(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="include-logs" className="cursor-pointer">
                    Include logs export
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Attach recent console logs and errors (helpful for debugging technical issues)
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Clicking "Send Support Request" will open your email client with a prefilled message.
                Review and send the email to complete your request.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Support Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
