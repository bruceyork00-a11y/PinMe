import { useSyncExternalStore } from 'react'
import type { ModelFavorite } from './types.js'

const STORAGE_KEY = 'dsh:pinme:favorites'
const EVENT_NAME = 'dsh:pinme:changed'

export function buildFavoriteId(provider: string, model: string, reasoningEffort?: string): string {
  return `${provider}/${model}:${reasoningEffort ?? 'default'}`
}

let cachedFavorites: ModelFavorite[] | null = null

function readRawFavorites(): ModelFavorite[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch (err) {
    console.error('[PinMe] Failed to parse favorites from localStorage:', err)
  }
  return []
}

export function getFavorites(): ModelFavorite[] {
  if (cachedFavorites === null) {
    cachedFavorites = readRawFavorites()
  }
  return cachedFavorites
}

function notifyChange(): void {
  cachedFavorites = readRawFavorites()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  }
}

export function saveFavorites(list: ModelFavorite[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    notifyChange()
  } catch (err) {
    console.error('[PinMe] Failed to save favorites to localStorage:', err)
  }
}

export function isFavorited(provider: string, model: string, reasoningEffort?: string): boolean {
  const id = buildFavoriteId(provider, model, reasoningEffort)
  return getFavorites().some(item => item.id === id)
}

export function toggleFavorite(
  data: Omit<ModelFavorite, 'id' | 'createdAt'>
): boolean {
  const id = buildFavoriteId(data.provider, data.model, data.reasoningEffort)
  const current = getFavorites()
  const exists = current.some(item => item.id === id)

  if (exists) {
    saveFavorites(current.filter(item => item.id !== id))
    return false
  } else {
    const newItem: ModelFavorite = {
      ...data,
      id,
      createdAt: Date.now(),
    }
    saveFavorites([...current, newItem])
    return true
  }
}

export function removeFavorite(id: string): void {
  const current = getFavorites()
  saveFavorites(current.filter(item => item.id !== id))
}

export function subscribeFavorites(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustom = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedFavorites = null
      callback()
    }
  }

  window.addEventListener(EVENT_NAME, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}

export function useFavorites(): ModelFavorite[] {
  return useSyncExternalStore(subscribeFavorites, getFavorites, () => [])
}
