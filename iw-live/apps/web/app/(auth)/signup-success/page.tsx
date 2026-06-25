import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"
import { Mail } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IntegrateWiseLogo variant="horizontal" className="h-8" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please check your email and click the confirmation link to activate your account. Once confirmed, you can
            sign in to your IntegrateWise workspace.
          </p>
          <a href="/login" className="text-primary hover:underline text-sm">
            Back to Sign In
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
