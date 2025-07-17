"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Moon, Sun, User, Lock, Eye, EyeOff, Mail } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick } = useSound()
  const { register, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
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
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!")
      return
    }

    setIsLoading(true)
    
    try {
      await register(
        formData.email,
        formData.firstName,
        formData.lastName,
        formData.password,
        formData.confirmPassword
      )
      // Navigation is handled by the auth context
    } catch (err: any) {
      setError(err.message || "Registration failed")
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
                width: "2.5rem",
                height: "2.5rem",
                objectFit: "contain",
              }}
            />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            Create Account
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>Join EvenSteven and start splitting expenses</p>
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
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
                <User size={18} style={{ color: "var(--text-secondary)" }} />
              </div>
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
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
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
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
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
              <Mail size={18} style={{ color: "var(--text-secondary)" }} />
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
              minLength={6}
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

          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
              <Lock size={18} style={{ color: "var(--text-secondary)" }} />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              minLength={6}
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link 
              href="/login" 
              style={{ 
                color: "var(--primary-green)", 
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>

        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textAlign: "center" }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
