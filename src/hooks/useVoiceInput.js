import { useState, useRef, useCallback } from 'react'

export function useVoiceInput({ onResult, onError }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!supported) {
      onError?.('Voice input is not supported in this browser.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-CA'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed') {
        onError?.('Microphone access denied. Please allow mic access and try again.')
      } else if (e.error !== 'no-speech') {
        onError?.('Voice input failed. Please try again.')
      }
    }
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      onResult?.(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [supported, onResult, onError])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { listening, supported, start, stop }
}