/**
 * Customer Success Data Hooks
 * 
 * These hooks connect to the Spine SSOT (Single Source of Truth) entities:
 * - Master Accounts (Accounts)
 * - Contacts & Stakeholders
 * - Meetings
 * - Risks
 * - Tasks
 * 
 * All hubs use these as CS-lens projections over the same Spine SSOT,
 * not as a separate "CS product"
 */

import { useMemo } from 'react'

// Types matching Spine schema
export interface Account {
  id: string
  name: string
  segment?: string
  industry?: string
  csm?: string
  arr: number
  health: number
  status: 'healthy' | 'at-risk' | 'active' | 'churned'
  renewalDate: string
  lastTouch: string
  // Add more fields as needed from Spine schema
}

export interface Contact {
  id: string
  name: string
  title?: string
  department?: string
  email?: string
  phone?: string
  accountId: string // Required relation to Master Accounts
  accountName?: string
  influenceLevel: 'champion' | 'executive' | 'decision-maker' | 'influencer' | 'user'
  relationshipStrength: 'strong' | 'medium' | 'weak'
  lastContact?: string
}

export interface Meeting {
  id: string
  title: string
  accountId: string // Required relation to Master Accounts (two-way)
  accountName?: string
  date: string
  time: string
  duration: number
  type: 'qbr' | 'check-in' | 'ebc' | 'workshop' | 'training'
  status: 'scheduled' | 'completed' | 'cancelled'
  attendees: string[]
  recordingUrl?: string | null
}

export interface Risk {
  id: string
  accountId: string
  title: string
  priority: 'high' | 'medium' | 'low'
  description: string
  mitigationPlan?: string[]
}

export interface Task {
  id: string
  accountId?: string
  title: string
  dueDate: string
  impact: string
  owner: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed'
}

/**
 * Hook to fetch accounts from Spine
 * Replace with actual Supabase/API call
 */
export function useAccounts() {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR('/api/accounts', fetcher)
  
  return {
    accounts: [] as Account[],
    isLoading: false,
    error: null,
  }
}

/**
 * Hook to fetch a single account by ID
 */
export function useAccount(accountId: string) {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR(`/api/accounts/${accountId}`, fetcher)
  
  return {
    account: null as Account | null,
    isLoading: false,
    error: null,
  }
}

/**
 * Hook to fetch contacts for an account
 */
export function useAccountContacts(accountId: string) {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR(`/api/accounts/${accountId}/contacts`, fetcher)
  
  return {
    contacts: [] as Contact[],
    isLoading: false,
    error: null,
  }
}

/**
 * Hook to fetch all contacts
 */
export function useContacts() {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR('/api/contacts', fetcher)
  
  return {
    contacts: [] as Contact[],
    isLoading: false,
    error: null,
  }
}

/**
 * Hook to fetch meetings for an account
 */
export function useAccountMeetings(accountId: string) {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR(`/api/accounts/${accountId}/meetings`, fetcher)
  
  return {
    meetings: [] as Meeting[],
    isLoading: false,
    error: null,
  }
}

/**
 * Hook to fetch all meetings
 */
export function useMeetings() {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR('/api/meetings', fetcher)
  
  return {
    meetings: [] as Meeting[],
    isLoading: false,
    error: null,
  }
}

/**
 * Hook to fetch risks for an account
 */
export function useAccountRisks(accountId: string) {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR(`/api/accounts/${accountId}/risks`, fetcher)
  
  return {
    risks: [] as Risk[],
    isLoading: false,
    error: null,
  }
}

/**
 * Hook to fetch tasks for an account
 */
export function useAccountTasks(accountId: string) {
  // TODO: Replace with actual data fetching
  // const { data, error, isLoading } = useSWR(`/api/accounts/${accountId}/tasks`, fetcher)
  
  return {
    tasks: [] as Task[],
    isLoading: false,
    error: null,
  }
}

/**
 * Calculate account portfolio KPIs
 */
export function useAccountKPIs(accounts: Account[]) {
  return useMemo(() => {
    const totalAccounts = accounts.length
    const totalARR = accounts.reduce((sum, acc) => sum + acc.arr, 0)
    const avgHealth = accounts.length > 0
      ? accounts.reduce((sum, acc) => sum + acc.health, 0) / accounts.length
      : 0
    const atRisk = accounts.filter(acc => acc.status === 'at-risk').length
    
    const today = new Date()
    const renewals90d = accounts.filter(acc => {
      const renewal = new Date(acc.renewalDate)
      const daysUntil = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 90 && daysUntil > 0
    })
    const renewalValue = renewals90d.reduce((sum, acc) => sum + acc.arr, 0)

    return {
      totalAccounts,
      totalARR,
      avgHealth: avgHealth.toFixed(1),
      atRisk,
      renewals90d: renewals90d.length,
      renewalValue,
    }
  }, [accounts])
}

/**
 * Format currency helper
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
  return `$${amount.toLocaleString()}`
}

/**
 * Format date helper
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get health score color
 */
export function getHealthColor(health: number): string {
  if (health >= 8) return 'text-green-600'
  if (health >= 6) return 'text-amber-600'
  return 'text-red-600'
}

/**
 * Get status badge classes
 */
export function getStatusBadgeClasses(status: Account['status']): string {
  const variants = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    'at-risk': 'bg-amber-100 text-amber-800 border-amber-200',
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    churned: 'bg-red-100 text-red-800 border-red-200',
  }
  return variants[status] || variants.active
}
