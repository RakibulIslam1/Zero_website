'use client'

import { useEffect } from 'react'

function enforceLightTheme() {
  const root = document.documentElement
  root.classList.remove('dark')
  root.classList.add('light')
  root.setAttribute('data-theme', 'light')
  root.style.colorScheme = 'light'
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
