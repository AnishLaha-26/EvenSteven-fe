import { Transaction } from "@/lib/api"
import { format } from "date-fns"

export function TransactionCard({ transaction }: { transaction: Transaction }) {
  // Format date to be more readable (e.g., "Jul 20, 2023")
  const formattedDate = format(new Date(transaction.date), "MMM d, yyyy")
  
  // Get first letter of each word in the payer's name for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Get color based on transaction status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'settled':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Format participant names
  const formatParticipants = (participants: typeof transaction.participants) => {
    if (participants.length === 0) return 'No participants'
    
    const names = participants.map(p => p.username || p.name || p.email.split('@')[0])
    
    if (names.length === 1) return `With ${names[0]}`
    if (names.length === 2) return `With ${names[0]} and ${names[1]}`
    return `With ${names[0]}, ${names[1]}, and ${names.length - 2} others`
  }

  // Clean category name for display
  const formatCategory = (category: string) => {
    if (!category) return 'Other'
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div 
      className="mb-4 transition-all hover:shadow-md rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <div className="flex items-center space-x-3">
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium"
            style={{
              backgroundColor: 'var(--primary-green)',
              color: 'white'
            }}
          >
            {getInitials(transaction.payer.username || transaction.payer.email)}
          </div>
          <div>
            <h3 
              className="font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {transaction.description}
            </h3>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {formatParticipants(transaction.participants)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div 
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {Math.abs(parseFloat(transaction.amount)).toLocaleString('en-US', {
              style: 'currency',
              currency: transaction.currency || 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {formattedDate}
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-0 px-4 pb-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(transaction.status)}`}>
          {formatCategory(transaction.category)}
        </span>
        <span className={`text-xs ${getStatusColor(transaction.status)} px-2.5 py-0.5 rounded-full`}>
          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </span>
      </div>
    </div>
  )
}

export function TransactionCardSkeleton() {
  return (
    <div 
      className="mb-4 animate-pulse rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="space-y-2 p-4">
        <div 
          className="h-4 rounded w-3/4"
          style={{ backgroundColor: 'var(--muted)' }}
        ></div>
        <div 
          className="h-3 rounded w-1/2"
          style={{ backgroundColor: 'var(--muted)' }}
        ></div>
      </div>
      <div className="flex justify-between px-4 pb-4">
        <div 
          className="h-4 rounded w-1/4"
          style={{ backgroundColor: 'var(--muted)' }}
        ></div>
        <div 
          className="h-4 rounded w-1/4"
          style={{ backgroundColor: 'var(--muted)' }}
        ></div>
      </div>
    </div>
  )
}
