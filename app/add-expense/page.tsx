"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Camera, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"

export default function AddExpensePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("Person 1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupId, setGroupId] = useState<string | null>(null)
  
  useEffect(() => {
    const groupIdParam = searchParams.get('groupId')
    if (groupIdParam) {
      setGroupId(groupIdParam)
    }
  }, [searchParams])
  
  const handleBack = () => {
    playClick()
    if (groupId) {
      router.push(`/group-dashboard/${groupId}`)
    } else {
      // Fallback to dashboard if no groupId is available
      router.push('/dashboard')
    }
  }

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    playSuccess()

    setTimeout(() => {
      setIsSubmitting(false)
    }, 2000)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)

    if (value && Number.parseFloat(value) > 100) {
      const input = e.target
      if (input && input.classList) {
        input.classList.add("shake")
        setTimeout(() => {
          if (input && input.classList) {
            input.classList.remove("shake")
          }
        }, 500)
      }
    }
  }

  const handleCameraClick = () => {
    playClick()
  }

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft className="icon" />
        </button>
        <h1>Add Expense 💸</h1>
        <div>
          <button className="theme-toggle" onClick={handleThemeToggle}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
        </div>
      </div>

      <div className="main-content">
        {isSubmitting && (
          <div className="success-message">
            <span>🎉 Expense added successfully! 🎉</span>
          </div>
        )}

        <form>
          <div className="form-group">
            <label className="label">Title</label>
            <input
              type="text"
              className="input"
              placeholder="What was this expense for? 🤔"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => playClick()}
            />
          </div>

          <div className="form-group">
            <label className="label">Amount 💰</label>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              onFocus={() => playClick()}
              style={{ fontSize: "1.5rem", textAlign: "center" }}
            />
            {amount && Number.parseFloat(amount) > 100 && (
              <p style={{ color: "var(--warning)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                💸 That's a big expense! Are you sure?
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Paid by</label>
            <select
              className="input"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              onFocus={() => playClick()}
            >
              <option value="Person 1">Person 1 (You) 👤</option>
              <option value="Person 2">Person 2 👥</option>
              <option value="Person 3">Person 3 👤</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Receipt (Optional) 📸</label>
            <button
              type="button"
              className="button button-secondary"
              style={{ marginBottom: "1rem" }}
              onClick={handleCameraClick}
            >
              <Camera className="icon" />
              Take Photo
            </button>
          </div>

          <Link href="/split-details">
            <button type="button" className="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                "Next: Split Details ➡️"
              )}
            </button>
          </Link>
        </form>
      </div>
    </div>
    </ProtectedRoute>
  )
}
