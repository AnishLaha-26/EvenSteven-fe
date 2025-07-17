"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Share2, Users, Trash2, Moon, Sun, UserMinus, LogOut, AlertTriangle } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"

interface Member {
  id: string
  name: string
  role: "admin" | "member"
  status: "active" | "pending"
  isCurrentUser: boolean
}

export default function GroupSettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playError, playSuccess } = useSound()
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [members, setMembers] = useState<Member[]>([
    {
      id: "1",
      name: "Person 1",
      role: "admin",
      status: "active",
      isCurrentUser: true,
    },
    {
      id: "2",
      name: "Person 2",
      role: "member",
      status: "active",
      isCurrentUser: false,
    },
    {
      id: "3",
      name: "Person 3",
      role: "member",
      status: "pending",
      isCurrentUser: false,
    },
  ])

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleShareCode = () => {
    playClick()
    // Copy to clipboard logic would go here
    alert("Group code copied to clipboard!")
  }

  const handleAddMember = () => {
    playClick()
  }

  const handleRemoveMember = (memberId: string) => {
    playClick()
    setShowRemoveDialog(memberId)
  }

  const confirmRemoveMember = (memberId: string) => {
    playSuccess()
    setMembers(members.filter((member) => member.id !== memberId))
    setShowRemoveDialog(null)
  }

  const handleLeaveGroup = () => {
    playClick()
    setShowLeaveDialog(true)
  }

  const confirmLeaveGroup = () => {
    playError()
    setShowLeaveDialog(false)
    // Navigate to home page
    window.location.href = "/"
  }

  const handleDeleteGroup = () => {
    playClick()
    setShowDeleteDialog(true)
  }

  const confirmDeleteGroup = () => {
    playError()
    setShowDeleteDialog(false)
    // Navigate to home page
    window.location.href = "/"
  }

  const currentUser = members.find((member) => member.isCurrentUser)
  const isAdmin = currentUser?.role === "admin"

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <Link href="/group-dashboard">
          <button className="back-button" onClick={() => playClick()}>
            <ArrowLeft className="icon" />
          </button>
        </Link>
        <h1>Group Settings</h1>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      <div className="main-content">
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Weekend Trip 🏖️</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Group Code: <strong>ABC123</strong>
          </p>

          <button className="button button-secondary" style={{ marginBottom: "1rem" }} onClick={handleShareCode}>
            <Share2 className="icon" />
            Share Group Code
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Members ({members.length})</h3>

          {members.map((member) => (
            <div key={member.id} className="participant-item">
              <div>
                <h4>
                  {member.name} {member.isCurrentUser ? "👤" : "👥"}
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {member.role === "admin" ? "Admin" : "Member"}
                  {member.isCurrentUser && " • You"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className={`status-badge ${member.status === "active" ? "status-settled" : "status-pending"}`}>
                  {member.status === "active" ? "Active" : "Pending"}
                </span>
                {isAdmin && !member.isCurrentUser && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    style={{
                      background: "var(--error)",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      padding: "0.5rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <UserMinus style={{ width: "1rem", height: "1rem" }} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isAdmin && (
            <button className="button button-secondary" style={{ marginTop: "1rem" }} onClick={handleAddMember}>
              <Users className="icon" />
              Add Member
            </button>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Actions</h3>

          <button
            className="button button-secondary"
            style={{ marginBottom: "1rem", color: "var(--warning)" }}
            onClick={handleLeaveGroup}
          >
            <LogOut className="icon" />
            Leave Group
          </button>

          {isAdmin && (
            <div>
              <h3 style={{ marginBottom: "1rem", color: "var(--error)" }}>Danger Zone</h3>
              <button className="button" style={{ backgroundColor: "var(--error)" }} onClick={handleDeleteGroup}>
                <Trash2 className="icon" />
                Delete Group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Remove Member Dialog */}
      {showRemoveDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRemoveDialog(null)}
        >
          <div
            className="card"
            style={{
              margin: "1rem",
              maxWidth: "300px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <AlertTriangle
                style={{ width: "3rem", height: "3rem", color: "var(--warning)", margin: "0 auto 1rem" }}
              />
              <h3 style={{ marginBottom: "0.5rem" }}>Remove Member</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to remove {members.find((m) => m.id === showRemoveDialog)?.name} from the group?
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="button button-secondary" style={{ flex: 1 }} onClick={() => setShowRemoveDialog(null)}>
                Cancel
              </button>
              <button
                className="button"
                style={{ flex: 1, backgroundColor: "var(--error)" }}
                onClick={() => confirmRemoveMember(showRemoveDialog)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Dialog */}
      {showLeaveDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowLeaveDialog(false)}
        >
          <div
            className="card"
            style={{
              margin: "1rem",
              maxWidth: "300px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <LogOut style={{ width: "3rem", height: "3rem", color: "var(--warning)", margin: "0 auto 1rem" }} />
              <h3 style={{ marginBottom: "0.5rem" }}>Leave Group</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to leave "Weekend Trip"? You'll need an invitation to rejoin.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="button button-secondary" style={{ flex: 1 }} onClick={() => setShowLeaveDialog(false)}>
                Cancel
              </button>
              <button
                className="button"
                style={{ flex: 1, backgroundColor: "var(--warning)" }}
                onClick={confirmLeaveGroup}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Dialog */}
      {showDeleteDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="card"
            style={{
              margin: "1rem",
              maxWidth: "300px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <Trash2 style={{ width: "3rem", height: "3rem", color: "var(--error)", margin: "0 auto 1rem" }} />
              <h3 style={{ marginBottom: "0.5rem" }}>Delete Group</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                This action cannot be undone. All expenses and data will be permanently deleted.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="button"
                style={{ flex: 1, backgroundColor: "var(--error)" }}
                onClick={confirmDeleteGroup}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  )
}
