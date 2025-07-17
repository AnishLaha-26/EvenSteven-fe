"use client"

import { useCallback } from "react"

export function useSound() {
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = "sine") => {
    if (typeof window === "undefined") return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
    } catch (error) {
      // Silently fail if audio is not supported
      console.log("Audio not supported")
    }
  }, [])

  const playClick = useCallback(() => {
    try {
      playSound(800, 0.1)
    } catch (error) {
      // Silently fail
    }
  }, [playSound])

  const playSuccess = useCallback(() => {
    try {
      playSound(523, 0.2)
      setTimeout(() => playSound(659, 0.2), 100)
      setTimeout(() => playSound(784, 0.3), 200)
    } catch (error) {
      // Silently fail
    }
  }, [playSound])

  const playError = useCallback(() => {
    try {
      playSound(200, 0.3, "sawtooth")
    } catch (error) {
      // Silently fail
    }
  }, [playSound])

  const playMoney = useCallback(() => {
    try {
      playSound(440, 0.1)
      setTimeout(() => playSound(554, 0.1), 50)
      setTimeout(() => playSound(659, 0.2), 100)
    } catch (error) {
      // Silently fail
    }
  }, [playSound])

  return { playClick, playSuccess, playError, playMoney }
}
