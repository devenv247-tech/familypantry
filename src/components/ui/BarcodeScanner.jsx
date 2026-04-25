import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    readerRef.current = codeReader

    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result) {
        setScanning(false)
        onScan(result.getText())
        codeReader.reset()
      }
    }).catch(err => {
      setError('Camera access denied. Please allow camera access and try again.')
    })

    return () => {
      codeReader.reset()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-card w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-textPrimary">Scan barcode</h3>
          <button onClick={onClose} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="bg-red-50 border border-red-100 rounded-btn p-4 text-sm text-danger text-center">
              {error}
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-btn"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
              />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl"/>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr"/>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl"/>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br"/>
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/50 animate-pulse"/>
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-textMuted text-center mt-3">
            Point your camera at the barcode on the product
          </p>
        </div>

      </div>
    </div>
  )
}