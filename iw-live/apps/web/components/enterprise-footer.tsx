"use client"

import Link from "next/link"
import { HelpCircle, FileText, Shield, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EnterpriseFooterProps {
  className?: string
}

export function EnterpriseFooter({ className }: EnterpriseFooterProps) {
  return (
    <footer className={cn("border-t border-border bg-card/50 backdrop-blur-sm", className)}>
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">IntegrateWise</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise workspace platform. Unify your tools, data, and AI into one governed Spine.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                Enterprise Ready
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                SOC 2
              </Badge>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/today" className="hover:text-foreground transition-colors">
                  Today View
                </Link>
              </li>
              <li>
                <Link href="/iq-hub" className="hover:text-foreground transition-colors">
                  IQ Hub
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="hover:text-foreground transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/governance" className="hover:text-foreground transition-colors">
                  Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/knowledge" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <HelpCircle className="h-3 w-3" />
                  Support
                </Link>
              </li>
              <li>
                <Link href="/governance" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Security
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Enterprise</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/admin" className="hover:text-foreground transition-colors">
                  Admin Panel
                </Link>
              </li>
              <li>
                <Link href="/governance" className="hover:text-foreground transition-colors">
                  Governance
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} IntegrateWise. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/settings" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">
              Compliance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
