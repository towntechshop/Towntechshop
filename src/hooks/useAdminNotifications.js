import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LAST_SEEN_CONTACT_MESSAGES_KEY = 'admin_last_seen_contact_messages'
const POLL_INTERVAL_MS = 30000

export function markContactMessagesSeen() {
  try {
    localStorage.setItem(LAST_SEEN_CONTACT_MESSAGES_KEY, new Date().toISOString())
  } catch {
    // ignore storage errors
  }
}

function getLastSeenContactMessages() {
  try {
    return localStorage.getItem(LAST_SEEN_CONTACT_MESSAGES_KEY) || '1970-01-01T00:00:00.000Z'
  } catch {
    return '1970-01-01T00:00:00.000Z'
  }
}

export default function useAdminNotifications() {
  const location = useLocation()
  const [counts, setCounts] = useState({
    orders: 0,
    reviews: 0,
    messages: 0,
  })

  const fetchCounts = useCallback(async () => {
    const lastSeenMessages = getLastSeenContactMessages()

    const [ordersResult, reviewsResult, messagesResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', lastSeenMessages),
    ])

    setCounts({
      orders: ordersResult.count || 0,
      reviews: reviewsResult.count || 0,
      messages: messagesResult.count || 0,
    })
  }, [])

  useEffect(() => {
    fetchCounts()

    const intervalId = window.setInterval(fetchCounts, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [fetchCounts, location.pathname])

  useEffect(() => {
    const handleContactSeen = () => {
      fetchCounts()
    }

    window.addEventListener('admin-contact-messages-seen', handleContactSeen)

    return () => {
      window.removeEventListener('admin-contact-messages-seen', handleContactSeen)
    }
  }, [fetchCounts])

  return counts
}

export function getNotificationCount(counts, key) {
  if (!key || !counts) return 0
  return Number(counts[key] || 0)
}
