"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, BarChart3, DollarSign, Megaphone, Briefcase, Users, Globe, BookOpen, Target } from "lucide-react"
import Link from "next/link"

export function HubsDropdown() {
  const hubs = [
    { href: "/strategy", icon: Target, label: "Strategic Hub" },
    { href: "/metrics", icon: BarChart3, label: "Metrics Dashboard" },
    { href: "/sales", icon: DollarSign, label: "Sales Hub" },
    { href: "/campaigns", icon: Megaphone, label: "Marketing Hub" },
    { href: "/projects", icon: Briefcase, label: "Operations Hub" },
    { href: "/clients", icon: Users, label: "Clients" },
    { href: "/website", icon: Globe, label: "Website Manager" },
    { href: "/knowledge", icon: BookOpen, label: "Knowledge Hub" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <span>Hubs</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {hubs.map((hub, idx) => (
          <div key={hub.href}>
            <DropdownMenuItem asChild>
              <Link href={hub.href} className="flex items-center">
                <hub.icon className="h-4 w-4 mr-2" />
                {hub.label}
              </Link>
            </DropdownMenuItem>
            {idx === 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
