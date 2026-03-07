'use client'

import { useEffect } from 'react'

function enforceLightTheme() {
  const root = document.documentElement

  // Avoid writing repeatedly, otherwise MutationObserver can cause a tight loop.
  if (root.classList.contains('dark')) {
    root.classList.remove('dark')
  }
  if (!root.classList.contains('light')) {
    root.classList.add('light')
  }
  if (root.getAttribute('data-theme') !== 'light') {
    root.setAttribute('data-theme', 'light')
  }
  if (root.style.colorScheme !== 'light') {
    root.style.colorScheme = 'light'
  }
}

export default function ForceLightTheme() {
  useEffect(() => {
    enforceLightTheme()

    const observer = new MutationObserver(() => {
      enforceLightTheme()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    })

    return () => observer.disconnect()
  }, [])

  return null
}
