import { redirect } from "next/navigation"

export const metadata = {
  title: "Profile | IntegrateWise OS",
  description: "Your profile and personal settings",
}

export default function ProfilePage() {
  redirect("/settings?tab=profile")
}
