import { Button } from "@/components/ui/button"
import { Check, Download, ArrowRight } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"

export default function TemplateSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Purchase Successful!</h1>
          <p className="text-gray-600 mb-8">
            Your template is ready for download. You'll also receive an email with your download link and setup guide.
          </p>
          <div className="space-y-4">
            <Button size="lg" className="w-full" asChild>
              <Link href="/api/templates/download?id=purchased">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/templates">
                Browse More Templates
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
