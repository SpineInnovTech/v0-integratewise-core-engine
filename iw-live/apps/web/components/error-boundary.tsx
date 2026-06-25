"use client"

import type React from "react"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] ErrorBoundary caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="m-4 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              An error occurred while loading this section. Please try refreshing.
            </p>
            {this.state.error && (
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">{this.state.error.message}</pre>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false })} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(WrappedComponent: React.ComponentType<P>, fallback?: ReactNode) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}
