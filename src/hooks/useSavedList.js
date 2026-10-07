import { useEffect, useState } from 'react'
import { getSavedList, listEventName } from '../lib/savedLists'

export default function useSavedList(name) {
  const [items, setItems] = useState(() => getSavedList(name))

  useEffect(() => {
    const sync = () => setItems(getSavedList(name))
    const eventName = listEventName(name)

    window.addEventListener(eventName, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(eventName, sync)
      window.removeEventListener('storage', sync)
    }
  }, [name])

  return items
}
