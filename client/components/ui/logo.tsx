"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
  showText?: boolean
}

export function Logo({ size = "md", className, showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto",
    xl: "h-24 w-auto",
    "2xl": "h-32 w-auto"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/tourease-logo.png"
        alt="TourEase Logo"
        width={200}
        height={80}
        className={cn(sizeClasses[size])}
        priority
        style={{ objectFit: "contain" }}
        onError={(e) => {
          console.error("Logo image failed to load:", e)
        }}
      />
      {showText && (
        <span className="font-bold text-primary text-lg">TourEase</span>
      )}
    </div>
  )
}

export default Logo