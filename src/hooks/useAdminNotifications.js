import { useCallback, useEffect, useRef, useState } from 'react'
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

// صوت تنبيه بسيط (من غير ملفات) لما يوصل طلب جديد ولوحة التحكم مفتوحة
function playNewOrderSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    ;[0, 0.18, 0.36].forEach((offset, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = [880, 1175, 1568][index]
      gain.gain.setValueAtTime(0.0001, context.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.16)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(context.currentTime + offset)
      oscillator.stop(context.currentTime + offset + 0.18)
    })
  } catch {
    // المتصفح ممكن يمنع الصوت قبل أي ضغطة من المستخدم
  }
}

function showBrowserNotification(newCount) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const notification = new Notification('🛒 طلب جديد', {
      body: newCount > 1 ? `وصلك ${newCount} طلبات جديدة` : 'وصلك طلب جديد على الموقع',
      tag: 'new-order',
    })
    notification.onclick = () => {
      window.focus()
      window.location.assign('/admin/orders')
    }
  } catch {
    // ignore
  }
}

export function requestOrderNotificationPermission() {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  } catch {
    // ignore
  }
}

export default function useAdminNotifications() {
  const previousOrdersRef = useRef(null)
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

    const ordersCount = ordersResult.count || 0

    if (previousOrdersRef.current !== null && ordersCount > previousOrdersRef.current) {
      playNewOrderSound()
      showBrowserNotification(ordersCount - previousOrdersRef.current)
    }
    previousOrdersRef.current = ordersCount

    setCounts({
      orders: ordersCount,
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
