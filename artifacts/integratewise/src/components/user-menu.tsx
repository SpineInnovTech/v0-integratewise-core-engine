import { useLocation } from "wouter"
import { useUser, useClerk } from "@clerk/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, UserIcon } from "lucide-react"
import { basePath } from "@/components/auth/clerk-config"

export function UserMenu() {
  const [_, navigate] = useLocation()
  const { user } = useUser()
  const { signOut } = useClerk()

  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account"
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {email ? (
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ redirectUrl: basePath || "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
