'use client'

import { useEffect } from 'react'

/**
 * Best-effort Pre-Warm für den Render-Python-NLP-Service.
 * Free-Tier schläft nach 15 Minuten ein → 5-30 s Cold-Start.
 * Wird auf /train-Mode-Komponenten und auf /dashboard montiert,
 * damit beim ersten Submit der Service möglichst schon heiß ist.
 */
export function NlpPreWarm() {
  useEffect(() => {
    fetch('/api/nlp/warm').catch(() => {})
  }, [])
  return null
}
