"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Moon, Sun, User, Lock, Eye, EyeOff } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick } = useSound()
  const { login, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick()
    const button = e.currentTarget
    if (button) {
      button.classList.add("button-pulse")
      setTimeout(() => {
        if (button) {
          button.classList.remove("button-pulse")
        }
      }, 600)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      await login(formData.email, formData.password)
      // Navigation is handled by the auth context
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="container">
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <Link href="/" style={{ textDecoration: "none" }}>
          <h1>EvenSteven</h1>
        </Link>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      <div className="main-content">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              backgroundColor: "var(--primary-green)",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <img 
              src="/logo.png" 
              alt="EvenSteven Logo" 
              style={{
                width: "3rem",
                height: "3rem",
                objectFit: "contain",
              }}
            />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            Welcome Back
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            color: "#dc2626",
            fontSize: "0.875rem",
            marginBottom: "1rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
              <User size={18} style={{ color: "var(--text-secondary)" }} />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "1rem",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary-green)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
              <Lock size={18} style={{ color: "var(--text-secondary)" }} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "0.75rem 2.5rem 0.75rem 2.5rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "1rem",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary-green)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: "0",
                zIndex: 1,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit" 
            className="button" 
            onClick={handleButtonClick}
            disabled={isLoading}
            style={{ 
              marginTop: "0.5rem",
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Don't have an account?{" "}
            <Link 
              href="/register" 
              style={{ 
                color: "var(--primary-green)", 
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Sign up
            </Link>
          </p>
          
          {/* <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              Demo Account
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
              Email: demo@evensteven.com<br />
              Password: demo123
            </p>
          </div> */}
        </div>
      </div>
    </div>
  )
}
