import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function StartCSPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  // Persist lens hint in cookie
  const cookieStore = await cookies()
  cookieStore.set("lens_hint", "cs", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })

  // Preserve UTM params for attribution
  const utmParams = new URLSearchParams()
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
  utmKeys.forEach((key) => {
    const value = params[key]
    if (typeof value === "string") {
      utmParams.set(key, value)
    }
  })

  const queryString = utmParams.toString()
  const signupUrl = queryString ? `/signup?lens=cs&${queryString}` : "/signup?lens=cs"

  redirect(signupUrl)
}
