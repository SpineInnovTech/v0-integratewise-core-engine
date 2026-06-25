import Image from "next/image"

export function IntegrateWiseLogo({ className = "h-8 w-8" }: { className?: string }) {
  return <Image src="/logo-256.webp" alt="IntegrateWise" width={32} height={32} className={className} priority />
}
