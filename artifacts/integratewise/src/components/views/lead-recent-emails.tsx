/**
 * Recent emails for a lead — surfaces the live Gmail conversation with this
 * contact on their CRM record. Read-only, live from the relay; deep-links into
 * the Email workspace for the full thread.
 */
import { Link } from "wouter";
import { useGmailMessages } from "@/platform/gateway-email";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, ChevronRight } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function LeadRecentEmails({ email }: { email?: string | null }) {
  const enabled = Boolean(email);
  const { data, isPending, isError } = useGmailMessages(
    enabled ? { q: `from:${email} OR to:${email}`, maxResults: 5 } : {},
  );

  if (!enabled) return null;

  const emails = data?.emails ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="h-4 w-4" /> Recent Emails
          <Badge
            variant="secondary"
            className="ml-auto text-[10px] font-normal"
            title="Live from Gmail via the local relay."
          >
            live · Gmail
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn't reach Gmail just now.
          </p>
        ) : emails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No emails with {email} yet.
          </p>
        ) : (
          emails.map((m) => (
            <Link
              key={m.id}
              href={`/email?q=${encodeURIComponent(`from:${email} OR to:${email}`)}&open=${m.id}`}
              className="flex items-center gap-2 rounded-lg border border-border/60 p-2 hover:bg-secondary/40 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.subject}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {m.preview}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDate(m.received_at)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
