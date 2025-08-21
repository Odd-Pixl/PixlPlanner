import { defineStore } from 'pinia'
import { ref } from 'vue'

const UNLOCK_KEY = 'pixl-planner-editor-unlocked'

export const useAuthStore = defineStore('auth', () => {
  const isUnlocked = ref(false)
  const storedHash = (import.meta.env.VITE_EDIT_PASSWORD_HASH || '').trim()

  function load() {
    try {
      const saved = localStorage.getItem(UNLOCK_KEY)
      isUnlocked.value = saved === 'true'
    } catch (_) {
      isUnlocked.value = false
    }
  }

  function save() {
    try {
      localStorage.setItem(UNLOCK_KEY, isUnlocked.value ? 'true' : 'false')
    } catch (_) {
      // ignore
    }
  }

  async function unlock(password) {
    if (!password) return false
    try {
      const enc = new TextEncoder().encode(password)
      const digest = await crypto.subtle.digest('SHA-256', enc)
      const hashArray = Array.from(new Uint8Array(digest))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      if (storedHash && hashHex !== storedHash) return false
      isUnlocked.value = true
      save()
      return true
    } catch (_) {
      return false
    }
  }

  function lock() {
    isUnlocked.value = false
    save()
  }

  // initialize
  load()

  return { isUnlocked, unlock, lock }
})
