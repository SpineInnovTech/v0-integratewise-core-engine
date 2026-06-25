import type { HubType } from "@/lib/cms/types"

export const TRANSFORM_PRESETS = {
  thumb: { width: 320, height: 320, crop: "fill" as const, quality: "auto" as const, format: "auto" as const },
  card: { width: 640, height: 360, crop: "fill" as const, quality: "auto" as const, format: "auto" as const },
  hero: { width: 1600, height: 900, crop: "fill" as const, quality: "auto" as const, format: "auto" as const },
  banner: { width: 1200, height: 400, crop: "fill" as const, quality: "auto" as const, format: "auto" as const },
  avatar: {
    width: 128,
    height: 128,
    crop: "thumb" as const,
    gravity: "face" as const,
    quality: "auto" as const,
    format: "auto" as const,
  },
} as const

export type TransformPreset = keyof typeof TRANSFORM_PRESETS

export interface ImageTransformOptions {
  width?: number
  height?: number
  crop?: "fill" | "fit" | "scale" | "crop" | "thumb" | "limit" | "pad"
  quality?: number | "auto"
  format?: "auto" | "webp" | "avif" | "jpg" | "png"
  gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west"
  blur?: number
  grayscale?: boolean
  focalPoint?: { x: number; y: number }
}

export function getCloudinaryFolder(hub: HubType, type: string): string {
  return `integratewise/${hub}/${type}`
}

export function generatePublicId(hub: HubType, type: string, slug: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const hash = Math.random().toString(36).substring(2, 10)
  return `${hub}/${type}/${slug}-${date}-${hash}`
}

export class CloudinaryService {
  private cloudName: string | undefined

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
  }

  getPresetUrl(publicId: string, preset: TransformPreset): string {
    return this.getImageUrl(publicId, TRANSFORM_PRESETS[preset])
  }

  getImageUrl(publicId: string, options: ImageTransformOptions = {}): string {
    if (!this.cloudName || !publicId) {
      return publicId || "/placeholder.svg?height=400&width=600"
    }

    const {
      width,
      height,
      crop = "fill",
      quality = "auto",
      format = "auto",
      gravity = "auto",
      blur,
      grayscale,
      focalPoint,
    } = options

    const transformations: string[] = []

    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (crop) transformations.push(`c_${crop}`)
    if (focalPoint) {
      transformations.push(`g_xy_center,x_${focalPoint.x},y_${focalPoint.y}`)
    } else if (gravity) {
      transformations.push(`g_${gravity}`)
    }
    if (quality) transformations.push(`q_${quality}`)
    if (format) transformations.push(`f_${format}`)
    if (blur) transformations.push(`e_blur:${blur}`)
    if (grayscale) transformations.push("e_grayscale")

    const transformation = transformations.join(",")

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformation}/${publicId}`
  }

  getSrcSet(publicId: string, widths: number[] = [320, 640, 1024, 1600, 1920]): string {
    return widths.map((w) => `${this.getImageUrl(publicId, { width: w })} ${w}w`).join(", ")
  }

  getResponsiveImageUrls(publicId: string) {
    return {
      thumb: this.getPresetUrl(publicId, "thumb"),
      card: this.getPresetUrl(publicId, "card"),
      hero: this.getPresetUrl(publicId, "hero"),
      banner: this.getPresetUrl(publicId, "banner"),
      avatar: this.getPresetUrl(publicId, "avatar"),
    }
  }

  getVideoUrl(publicId: string, options: { width?: number; quality?: string } = {}): string {
    if (!this.cloudName || !publicId) {
      return publicId || ""
    }

    const { width, quality = "auto" } = options
    const transformations: string[] = []

    if (width) transformations.push(`w_${width}`)
    if (quality) transformations.push(`q_${quality}`)

    const transformation = transformations.join(",")

    return `https://res.cloudinary.com/${this.cloudName}/video/upload/${transformation}/${publicId}`
  }
}

export const cloudinary = new CloudinaryService()
