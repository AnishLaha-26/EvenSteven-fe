"use client"

import { useEffect } from "react"

interface ConfettiProps {
  active: boolean
  onComplete?: () => void
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  useEffect(() => {
    if (!active) return

    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]
    const confettiElements: HTMLElement[] = []

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div")
      confetti.className = "confetti"
      confetti.style.left = Math.random() * 100 + "vw"
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.animationDelay = Math.random() * 3 + "s"
      confetti.style.animationDuration = Math.random() * 3 + 2 + "s"
      document.body.appendChild(confetti)
      confettiElements.push(confetti)
    }

    const timeout = setTimeout(() => {
      confettiElements.forEach((el) => el.remove())
      onComplete?.()
    }, 5000)

    return () => {
      clearTimeout(timeout)
      confettiElements.forEach((el) => el.remove())
    }
  }, [active, onComplete])

  return null
}
