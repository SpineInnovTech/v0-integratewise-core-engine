"use client"

import Image from "next/image"
import { cloudinary as cloudinaryService, type TransformPreset, TRANSFORM_PRESETS } from "@/lib/media/cloudinary"
import { useState } from "react"

interface CloudinaryImageProps {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number | "auto"
  crop?: "fill" | "fit" | "scale" | "crop" | "thumb" | "limit" | "pad"
  gravity?: "auto" | "face" | "center"
  preset?: TransformPreset
  focalPoint?: { x: number; y: number }
}

export function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  className = "",
  priority = false,
  quality = "auto",
  crop = "fill",
  gravity = "auto",
  preset,
  focalPoint,
}: CloudinaryImageProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError || !publicId) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">Image unavailable</span>
      </div>
    )
  }

  let imageUrl: string
  let finalWidth: number
  let finalHeight: number

  if (preset) {
    const presetConfig = TRANSFORM_PRESETS[preset]
    imageUrl = cloudinaryService.getPresetUrl(publicId, preset)
    finalWidth = presetConfig.width
    finalHeight = presetConfig.height
  } else {
    finalWidth = width || 1200
    finalHeight = height || 630
    imageUrl = cloudinaryService.getImageUrl(publicId, {
      width: finalWidth,
      height: finalHeight,
      quality,
      format: "auto",
      crop,
      gravity,
      focalPoint,
    })
  }

  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      className={className}
      priority={priority}
      onError={() => setImageError(true)}
    />
  )
}

export function PresetCloudinaryImage({
  publicId,
  alt,
  preset,
  className = "",
  priority = false,
}: {
  publicId: string
  alt: string
  preset: TransformPreset
  className?: string
  priority?: boolean
}) {
  const [imageError, setImageError] = useState(false)

  if (imageError || !publicId) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">Image unavailable</span>
      </div>
    )
  }

  const presetConfig = TRANSFORM_PRESETS[preset]
  const imageUrl = cloudinaryService.getPresetUrl(publicId, preset)

  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={alt}
      width={presetConfig.width}
      height={presetConfig.height}
      className={className}
      priority={priority}
      onError={() => setImageError(true)}
    />
  )
}

export function ResponsiveCloudinaryImage({
  publicId,
  alt,
  className = "",
  priority = false,
}: {
  publicId: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const [imageError, setImageError] = useState(false)

  if (imageError || !publicId) {
    return (
      <div className={`bg-muted aspect-video flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">Image unavailable</span>
      </div>
    )
  }

  const urls = cloudinaryService.getResponsiveImageUrls(publicId)
  const srcSet = cloudinaryService.getSrcSet(publicId)

  return (
    <picture>
      <source media="(max-width: 640px)" srcSet={urls.card} />
      <source media="(max-width: 1024px)" srcSet={urls.hero} />
      <img
        src={urls.hero || "/placeholder.svg"}
        srcSet={srcSet}
        sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1600px"
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        onError={() => setImageError(true)}
      />
    </picture>
  )
}
