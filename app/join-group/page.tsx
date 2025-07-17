"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"

export default function JoinGroupPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const [code, setCode] = useState("")

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleJoinGroup = () => {
    playSuccess()
  }

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <Link href="/dashboard">
          <button className="back-button" onClick={() => playClick()}>
            <ArrowLeft className="icon" />
          </button>
        </Link>
        <h1>Join Group</h1>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      <div className="main-content">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Enter the group code to join</p>
        </div>

        <form>
          <div className="form-group">
            <label className="label">Group Code</label>
            <input
              type="text"
              className="input"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={() => playClick()}
              style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }}
            />
          </div>

          <Link href="/group-dashboard">
            <button type="button" className="button" onClick={handleJoinGroup}>
              Join Group
            </button>
          </Link>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Don't have a code? Ask the group creator to share it with you.
          </p>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
