"use client";

import * as React from "react";
import { Copy, KeyRound, Link2, ShieldCheck, ToggleLeft, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type ProvisioningState = {
  ssoEnabled: boolean;
  ssoProvider: "google" | "microsoft" | "okta" | "azuread" | "custom";
  jitEnabled: boolean;
  scimEnabled: boolean;
  scimToken: string;
  domains: Array<{ domain: string; verified: boolean }>;
  inviteLinkEnabled: boolean;
  inviteLink: string;
};

const initialState: ProvisioningState = {
  ssoEnabled: true,
  ssoProvider: "okta",
  jitEnabled: true,
  scimEnabled: false,
  scimToken: "scim_***_rotate_me",
  domains: [
    { domain: "acme.com", verified: true },
    { domain: "acme.dev", verified: false },
  ],
  inviteLinkEnabled: true,
  inviteLink: "https://integratewise.local/invite/acme/abc123",
};

export function ProvisioningPage() {
  const [state, setState] = React.useState<ProvisioningState>(initialState);
  const [newDomain, setNewDomain] = React.useState("");

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied", { description: `${label} copied to clipboard.` });
    } catch {
      toast.error("Copy failed", { description: "Clipboard not available." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Auth & Provisioning</h1>
        <p className="text-sm text-slate-500 mt-1">
          Slack-style control surface for SSO, SCIM, invite links, and domain verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">SSO</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{state.ssoEnabled ? "Enabled" : "Disabled"}</p>
            <Badge variant={state.ssoEnabled ? "default" : "secondary"}>{state.ssoProvider}</Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">SCIM</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold">
              {state.scimEnabled ? "Enabled" : "Not configured"}
            </p>
            <Badge variant={state.scimEnabled ? "default" : "secondary"}>
              {state.scimEnabled ? "Active" : "Off"}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Domains</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{state.domains.length}</p>
            <Badge variant="outline">
              {state.domains.filter((d) => d.verified).length} verified
            </Badge>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="auth">
        <TabsList>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="scim">SCIM</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="mt-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-iw-slate" />
                  <h2 className="text-sm font-semibold">Single Sign-On (SSO)</h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Control how members sign in to your workspace. Configure SAML/OIDC later; this is
                  UI-first.
                </p>
              </div>
              <Button
                variant={state.ssoEnabled ? "outline" : "default"}
                onClick={() => setState((s) => ({ ...s, ssoEnabled: !s.ssoEnabled }))}
              >
                {state.ssoEnabled ? "Disable" : "Enable"}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(
                [
                  { key: "okta", label: "Okta" },
                  { key: "google", label: "Google Workspace" },
                  { key: "microsoft", label: "Microsoft Entra ID" },
                  { key: "azuread", label: "Azure AD (legacy)" },
                ] as const
              ).map((p) => {
                const active = state.ssoProvider === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, ssoProvider: p.key }))}
                    className={`text-left rounded-xl border p-4 transition-colors ${
                      active
                        ? "border-iw-slate/20 bg-iw-slate/5"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{p.label}</p>
                      {active ? (
                        <Badge className="text-[10px]">Selected</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Select
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Mock config • UI-first</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <ToggleLeft className="h-4 w-4 text-slate-600" />
                <p className="text-sm font-semibold">Just-in-time provisioning</p>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Automatically create users on first SSO sign-in (recommended for team/org).
              </p>
              <div className="mt-3">
                <Button
                  variant={state.jitEnabled ? "outline" : "default"}
                  onClick={() => setState((s) => ({ ...s, jitEnabled: !s.jitEnabled }))}
                >
                  {state.jitEnabled ? "Disable JIT" : "Enable JIT"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="scim" className="mt-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-iw-slate" />
                  <h2 className="text-sm font-semibold">SCIM Provisioning</h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Automate user lifecycle (create, deactivate, role mapping). Keep it simple for
                  now.
                </p>
              </div>
              <Button
                variant={state.scimEnabled ? "outline" : "default"}
                onClick={() => setState((s) => ({ ...s, scimEnabled: !s.scimEnabled }))}
              >
                {state.scimEnabled ? "Disable" : "Enable"}
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">SCIM token</p>
                  <p className="text-sm font-semibold mt-1">{state.scimToken}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => copy(state.scimToken, "SCIM token")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      const next = `scim_${Math.random().toString(16).slice(2)}_rotated`;
                      setState((s) => ({ ...s, scimToken: next }));
                      toast.success("Rotated", { description: "SCIM token rotated (mock)." });
                    }}
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Rotate
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Wire this into a real SCIM endpoint later.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="mt-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Domain verification</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Claim domains to restrict sign-in and enable auto-join.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {state.domains.map((d) => (
                <Card key={d.domain} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{d.domain}</p>
                      <p className="text-xs text-slate-500 mt-1">DNS TXT verification (mock)</p>
                    </div>
                    <Badge variant={d.verified ? "default" : "secondary"}>
                      {d.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {d.verified ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            domains: s.domains.map((x) =>
                              x.domain === d.domain ? { ...x, verified: false } : x
                            ),
                          }))
                        }
                      >
                        Mark unverified
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            domains: s.domains.map((x) =>
                              x.domain === d.domain ? { ...x, verified: true } : x
                            ),
                          }))
                        }
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          domains: s.domains.filter((x) => x.domain !== d.domain),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <Label htmlFor="newDomain">Add domain</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id="newDomain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                />
                <Button
                  onClick={() => {
                    const domain = newDomain.trim().toLowerCase();
                    if (!domain) return;
                    setState((s) => ({
                      ...s,
                      domains: [{ domain, verified: false }, ...s.domains],
                    }));
                    setNewDomain("");
                    toast.success("Domain added", { description: "Verification pending (mock)." });
                  }}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                In a real setup, you’d display TXT records here.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-iw-slate" />
                  <h2 className="text-sm font-semibold">Invite links</h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Enable a shareable link for inviting members (team/org).
                </p>
              </div>
              <Button
                variant={state.inviteLinkEnabled ? "outline" : "default"}
                onClick={() => setState((s) => ({ ...s, inviteLinkEnabled: !s.inviteLinkEnabled }))}
              >
                {state.inviteLinkEnabled ? "Disable" : "Enable"}
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Link</p>
              <p className="text-sm font-semibold mt-1 break-all">
                {state.inviteLinkEnabled ? state.inviteLink : "Disabled"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!state.inviteLinkEnabled}
                  onClick={() => copy(state.inviteLink, "Invite link")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  disabled={!state.inviteLinkEnabled}
                  onClick={() => {
                    const next = `https://integratewise.local/invite/acme/${Math.random().toString(16).slice(2)}`;
                    setState((s) => ({ ...s, inviteLink: next }));
                    toast.success("Rotated", { description: "Invite link rotated (mock)." });
                  }}
                >
                  Rotate
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
