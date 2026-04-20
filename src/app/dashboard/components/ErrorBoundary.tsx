"use client"
import React from "react"
import { color, font } from "@/lib/theme"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          minHeight: "100vh",
          background: color.bg0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font.sys,
          padding: 24,
        }}>
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: 16,
            padding: "32px 36px",
            maxWidth: 520,
            width: "100%",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: font.mono,
              fontSize: 11,
              color: color.amber,
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}>
              RUNTIME ERROR
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              color: color.t1,
              marginBottom: 16,
            }}>
              Something went wrong
            </div>
            <pre style={{
              fontFamily: font.mono,
              fontSize: 12,
              color: color.t3,
              background: color.bg2,
              border: `1px solid ${color.bd1}`,
              borderRadius: 8,
              padding: "12px 16px",
              textAlign: "left",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              marginBottom: 24,
            }}>
              {this.state.error?.message ?? "An unexpected error occurred."}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: color.amber,
                color: color.bg0,
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontFamily: font.mono,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
