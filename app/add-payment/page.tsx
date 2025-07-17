"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"

export default function AddPaymentPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const [amount, setAmount] = useState("")
  const [from, setFrom] = useState("Person 2")
  const [to, setTo] = useState("Person 1")

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleRecordPayment = () => {
    playSuccess()
  }

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <Link href="/group-dashboard">
          <button className="back-button" onClick={() => playClick()}>
            <ArrowLeft className="icon" />
          </button>
        </Link>
        <h1>Add Payment</h1>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      <div className="main-content">
        <form>
          <div className="form-group">
            <label className="label">Amount</label>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => playClick()}
              style={{ fontSize: "1.5rem", textAlign: "center" }}
            />
          </div>

          <div className="form-group">
            <label className="label">From</label>
            <select
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              onFocus={() => playClick()}
            >
              <option value="Person 1">Person 1 (You)</option>
              <option value="Person 2">Person 2</option>
              <option value="Person 3">Person 3</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">To</label>
            <select className="input" value={to} onChange={(e) => setTo(e.target.value)} onFocus={() => playClick()}>
              <option value="Person 1">Person 1 (You)</option>
              <option value="Person 2">Person 2</option>
              <option value="Person 3">Person 3</option>
            </select>
          </div>

          <Link href="/group-dashboard">
            <button type="button" className="button" onClick={handleRecordPayment}>
              Record Payment
            </button>
          </Link>
        </form>
      </div>
    </div>
    </ProtectedRoute>
  )
}
