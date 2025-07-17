"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"

export default function SplitDetailsPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const [splitType, setSplitType] = useState("equal")
  const [participants] = useState([
    { name: "Person 1", amount: 30.0, selected: true },
    { name: "Person 2", amount: 30.0, selected: true },
    { name: "Person 3", amount: 30.0, selected: true },
  ])

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleSplitTypeChange = (type: string) => {
    playClick()
    setSplitType(type)
  }

  const handleSaveExpense = () => {
    playSuccess()
  }

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <Link href="/add-expense">
          <button className="back-button" onClick={() => playClick()}>
            <ArrowLeft className="icon" />
          </button>
        </Link>
        <h1>Split Details</h1>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      <div className="main-content">
        <div className="amount-display">$90.00</div>

        <div className="form-group">
          <label className="label">Split Type</label>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              type="button"
              className={`button ${splitType === "equal" ? "" : "button-secondary"}`}
              style={{ flex: 1 }}
              onClick={() => handleSplitTypeChange("equal")}
            >
              Equal
            </button>
            <button
              type="button"
              className={`button ${splitType === "custom" ? "" : "button-secondary"}`}
              style={{ flex: 1 }}
              onClick={() => handleSplitTypeChange("custom")}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Split Between</h3>

          {participants.map((participant, index) => (
            <div key={index} className="split-item">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "0.25rem",
                    backgroundColor: participant.selected ? "var(--primary-green)" : "var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {participant.selected && <Check style={{ width: "1rem", height: "1rem", color: "white" }} />}
                </div>
                <span>{participant.name}</span>
              </div>
              <span className="balance-positive">${participant.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <Link href="/group-dashboard">
          <button className="button" style={{ marginTop: "2rem" }} onClick={handleSaveExpense}>
            Save Expense
          </button>
        </Link>
      </div>
    </div>
    </ProtectedRoute>
  )
}
