"use client"

import type React from "react"

import Link from "next/link"
import { Plus, Users, Moon, Sun, User } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { useState, useEffect } from "react"
import { Confetti } from "@/components/confetti"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playMoney } = useSound()
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [easterEggCount, setEasterEggCount] = useState(0)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleEasterEgg = () => {
    const newCount = easterEggCount + 1
    setEasterEggCount(newCount)

    if (newCount === 69) {
      playMoney()
      setShowConfetti(true)
      setEasterEggCount(0)
    } else {
      playClick()
    }
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
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="header">
        <h1>EvenSteven</h1>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>
      <div className="main-content">
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <div
            className="easter-egg-trigger"
            onClick={handleEasterEgg}
            style={{
              width: "5rem",
              height: "5rem",
              backgroundColor: "var(--primary-green)",
              borderRadius: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              transition: "all 0.3s ease",
              overflow: "hidden",
            }}
          >
            
            <img 
              src="/logo.png" 
              alt="EvenSteven Logo" 
              style={{
                width: "3.3rem",
                height: "3.3rem",
                objectFit: "contain",
                transition: "transform 1s ease-in-out",
                transform: easterEggCount > 0 ? "scale(1.2)" : "scale(1)",
              }}

            />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            Split expenses easily
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>Sign in to create groups and track shared expenses with friends</p>
          {easterEggCount > 0 && (
            <p style={{ color: "var(--primary-green)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              🎉 Keep clicking! ({easterEggCount}/69)
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/login">
            <button className="button" onClick={handleButtonClick}>
              <User className="icon" />
              Sign In
            </button>
          </Link>

          <Link href="/register">
            <button className="button button-secondary" onClick={handleButtonClick}>
              <Plus className="icon" />
              Create Account
            </button>
          </Link>
        </div>

        <div style={{ marginTop: "3rem" }}>
       
        </div>
      </div>
    </div>
  )
}
