"use client"

import type React from "react"

import Link from "next/link"
import { ArrowLeft, Settings, Receipt, CreditCard, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function GroupDashboardPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const [celebratingBalance, setCelebratingBalance] = useState<string | null>(null)

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleBalanceClick = (person: string, balance: number) => {
    if (balance === 0) {
      playSuccess()
      setCelebratingBalance(person)
      setTimeout(() => setCelebratingBalance(null), 1000)
    } else {
      playClick()
    }
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick()
    const button = e.currentTarget
    if (button && button.classList) {
      button.classList.add("button-wobble")
      setTimeout(() => {
        if (button && button.classList) {
          button.classList.remove("button-wobble")
        }
      }, 500)
    }
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
        <h1>Weekend Trip 🏖️</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="theme-toggle" onClick={handleThemeToggle}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
          <Link href="/group-settings">
            <button className="back-button" onClick={() => playClick()}>
              <Settings className="icon" />
            </button>
          </Link>
        </div>
      </div>

      <div className="main-content" style={{ paddingBottom: "6rem" }}>
        <div className="card">
          <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Balances 💰</h3>

          <div
            className="participant-item"
            onClick={() => handleBalanceClick("Person 1", 30)}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h4>Person 1 👤</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>You</p>
            </div>
            <span className={`balance-positive ${celebratingBalance === "Person 1" ? "balance-celebration" : ""}`}>
              +$30.00
            </span>
          </div>

          <div
            className="participant-item"
            onClick={() => handleBalanceClick("Person 2", -15)}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h4>Person 2 👥</h4>
            </div>
            <span className={`balance-negative ${celebratingBalance === "Person 2" ? "balance-celebration" : ""}`}>
              -$15.00
            </span>
          </div>

          <div
            className="participant-item"
            onClick={() => handleBalanceClick("Person 3", -15)}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h4>Person 3 👤</h4>
            </div>
            <span className={`balance-negative ${celebratingBalance === "Person 3" ? "balance-celebration" : ""}`}>
              -$15.00
            </span>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Recent Activity 📋</h3>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h4>Dinner at Restaurant 🍽️</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Paid by Person 1</p>
            </div>
            <span>$90.00</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4>Gas for Trip ⛽</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Paid by Person 2</p>
            </div>
            <span>$45.00</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <Link href="/add-expense" style={{ flex: 1 }}>
            <button className="button" onClick={handleButtonClick}>
              <Receipt className="icon" />
              Add Expense
            </button>
          </Link>

          <Link href="/add-payment" style={{ flex: 1 }}>
            <button className="button button-secondary" onClick={handleButtonClick}>
              <CreditCard className="icon" />
              Add Payment
            </button>
          </Link>
        </div>

        {/* Fun loading state */}
        <div style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-secondary)" }}>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Syncing with friends...</p>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
