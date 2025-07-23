"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, X, Moon, Sun, Mail, FileText, DollarSign } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { groupAPI, authAPI } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

export default function CreateGroupPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [participants, setParticipants] = useState([""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Common currencies for the selector
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "KRW", symbol: "₩", name: "South Korean Won" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
    { code: "DKK", symbol: "kr", name: "Danish Krone" },
    { code: "MXN", symbol: "$", name: "Mexican Peso" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "RUB", symbol: "₽", name: "Russian Ruble" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
    {code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "TRY", symbol: "₺", name: "Turkish Lira" },
    { code: "AED", symbol: "د.إ", name: "United Arab Emirates Dirham" },
    { code: "SAR", symbol: "ر.س", name: "Saudi Riyal" },
    { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
    { code: "PHP", symbol: "₱", name: "Philippine Peso" },
    { code: "ID R", symbol: "Rp", name: "Indonesian Rupiah" },
    { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
    { code: "PKR", symbol: "₨", name: " Pakistani Rupee" },
    { code: "EGP", symbol: "ج.م", name: "Egyptian Pound" },
    { code: "CLP", symbol: "$", name: "Chilean Peso" },
    { code: "COP", symbol: "$", name: "Colombian Peso" },
    { code: "PEN", symbol: "S/.", name: "Peruvian Sol" },
    { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
    { code: "RON", symbol: "lei", name: "Romanian Leu" },
    { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
    { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
    { code: "PLN", symbol: "zł", name: "Polish Zloty" } 
  ]

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const addParticipant = () => {
    playClick()
    setParticipants([...participants, ""])
  }

  const removeParticipant = (index: number) => {
    playClick()
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const updateParticipant = (index: number, value: string) => {
    setParticipants((prev) => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validation
    if (!groupName.trim()) {
      setError("Group name is required")
      return
    }
    
    if (participants.some(p => p.trim() && !isValidEmail(p))) {
      setError("Please enter valid email addresses")
      return
    }
    
    const validParticipants = participants.filter(p => p.trim())
    
    // Check authentication first
    if (!isAuthenticated || !user) {
      setError('Please log in to create a group')
      router.push('/login')
      return
    }

    // Check if access token exists
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setError('Authentication token missing. Please log in again.')
      router.push('/login')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('Creating group with user:', user.email)
      console.log('Access token exists:', !!token)
      console.log('Token value:', token)
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
      
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        currency: currency
      }

      console.log('Creating group with data:', groupData)
      console.log('About to make POST request to /groups/')
      const createdGroup = await groupAPI.createGroup(groupData)
      console.log('Group created successfully:', createdGroup)
      
      // TODO: Add participants as members after group creation
      // Note: The current API doesn't support adding members during group creation
      // Members need to be added separately using the addGroupMember API
      if (validParticipants.length > 0) {
        console.log('Note: Participants will need to be added separately:', validParticipants)
        // Future implementation: Add each participant as a member
        // for (const email of validParticipants) {
        //   await groupAPI.addGroupMember(createdGroup.id, { email })
        // }
      }
      playSuccess()
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating group:', error)
      
      if (error.response?.status === 401) {
        // Token might be expired, try to refresh
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          try {
            const refreshResponse = await authAPI.refreshToken(refreshToken)
            localStorage.setItem('accessToken', refreshResponse.access)
            // Retry the group creation
            const createdGroup = await groupAPI.createGroup({
              name: groupName.trim(),
              description: description.trim(),
              currency: currency
            })
            console.log('Group created successfully after token refresh:', createdGroup)
            playSuccess()
            router.push('/dashboard')
            return
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setError('Session expired. Please log in again.')
            router.push('/login')
            return
          }
        } else {
          setError('Authentication failed. Please log in again.')
          router.push('/login')
          return
        }
      } else if (error.response?.status === 405) {
        setError('The backend API does not support group creation yet. Please contact the development team.')
      } else if (error.response?.status === 403) {
        setError('You do not have permission to create groups.')
      } else if (error.response?.status === 400) {
        setError(`Invalid group data: ${error.response?.data?.detail || error.response?.data?.message || 'Please check your input'}`)
      } else if (error.message?.includes('backend API does not support')) {
        setError('Group creation is not yet available. The backend API is still being developed.')
      } else {
        setError(`Failed to create group: ${error.response?.data?.detail || error.message || 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
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
          <h1>Create Group</h1>
          <button className="theme-toggle" onClick={handleThemeToggle}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
        </div>

        <div className="main-content">
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

          <form onSubmit={handleCreateGroup}>
            <div className="form-group">
              <label className="label">Group Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter group name (e.g., Weekend Trip, Roommate Expenses)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onFocus={() => playClick()}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Currency</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "1rem", top: "0.9rem", zIndex: 1 }}>
                  <DollarSign size={16} style={{ color: "var(--text-secondary)" }} />
                </div>
                <select
                  className="input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  onFocus={() => playClick()}
                  style={{
                    paddingLeft: "2.5rem",
                    cursor: "pointer",
                    paddingTop: "0.8rem"
                  }}
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Group Creator (You)</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
                  <Mail size={18} style={{ color: "var(--text-secondary)" }} />
                </div>
                <input
                  type="email"
                  className="input"
                  value={user?.email || ""}
                  disabled
                  style={{
                    paddingLeft: "2.5rem",
                    backgroundColor: "var(--muted)",
                    cursor: "not-allowed",
                    opacity: 0.7
                  }}
                />
              </div>
            </div>

            
              
            

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                marginTop: '2rem',
                background: isLoading ? 'var(--muted)' : 'var(--primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={() => !isLoading && playClick()}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: "1rem",
                    height: "1rem",
                    border: "2px solid transparent",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }} />
                  Creating Group...
                </>
              ) : (
                <>
                  <Plus className="icon" />
                  Create Group
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}