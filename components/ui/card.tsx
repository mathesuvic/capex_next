"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Card container
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        "bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm",
        "flex flex-col gap-0", // header/content/footer control spacing
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

/**
 * Header section
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn(
        "px-6 py-4 border-b border-slate-200",
        "flex flex-col gap-1.5",
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

/**
 * Title
 */
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

/**
 * Description (subheading)
 */
const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-description"
      className={cn("text-sm text-slate-600", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

/**
 * Action area (aligned à direita por padrão)
 */
const CardAction = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-action"
      className={cn("ml-auto", className)}
      {...props}
    />
  )
)
CardAction.displayName = "CardAction"

/**
 * Main content
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn("px-6 py-4", className)}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

/**
 * Footer (ações/legendas)
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn("px-6 py-4 border-t border-slate-200 flex items-center gap-2", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
