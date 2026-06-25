import Link from "next/link"
import Image from "next/image"

/**
 * AppFooter - Application footer using theme tokens
 * Uses CSS variables for brand theming compatibility
 */
export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/images/integrateway-logo-markonly-transparent-indigo-v1.svg"
            alt="IntegrateWise Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div>
            <span className="text-lg font-semibold text-foreground">IntegrateWise</span>
            <p className="text-xs text-muted-foreground">AI Workspace</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">App</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link 
                  href="/personal/home" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Personal Hub
                </Link>
              </li>
              <li>
                <Link 
                  href="/business/dashboard" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Business Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/cs/tam" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Customer Success
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Hubs</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link 
                  href="/knowledge" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Knowledge
                </Link>
              </li>
              <li>
                <Link 
                  href="/integrations" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link 
                  href="/settings" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Settings
                </Link>
              </li>
              <li>
                <Link 
                  href="/profile" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link 
                  href="/onboarding" 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Getting Started
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Documentation
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  API Reference
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-muted-foreground">
                  Help Center
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Contact Us
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Status
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} IntegrateWise. All rights reserved.
            </p>
            <p className="text-sm font-medium text-brand">
              Normalize Once. Render Anywhere.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
