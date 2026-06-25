"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Settings, UserIcon, LogOut, CreditCard, Building2, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@integratewise.online",
  full_name: "Demo User",
  role: "Enterprise Admin",
  plan: "Enterprise",
}

export function EnhancedUserMenu() {
  const router = useRouter()

  const initials = DEMO_USER.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
          <Avatar className="h-9 w-9 ring-2 ring-border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold leading-none">{DEMO_USER.full_name}</p>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {DEMO_USER.plan}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">{DEMO_USER.email}</p>
            <p className="text-xs leading-none text-muted-foreground mt-1">{DEMO_USER.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Workspace Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
          <Building2 className="mr-2 h-4 w-4" />
          <span>Organization</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing & Plans</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          <span>Admin Panel</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
