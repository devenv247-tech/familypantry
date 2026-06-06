import Icon from './Icon'
export default function PhotoScanOverlay({ visible, imagePreview }) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
      {/* Image preview */}
      {imagePreview && (
        <div className="w-64 h-64 rounded-2xl overflow-hidden mb-8 border-2 border-white/20 shadow-2xl">
          <img src={imagePreview} alt="Scanning..." className="w-full h-full object-cover" />
        </div>
      )}

      {/* Scanning animation */}
      <div className="relative flex items-center justify-center mb-6">
        <span className="absolute w-24 h-24 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        <span className="absolute w-16 h-16 rounded-full bg-purple-500/30 animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }} />
        <div className="relative w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
          <Icon name="aiScan" size={26} color="white" />
        </div>
      </div>

      <p className="text-white text-lg font-semibold mb-2">Scanning your photo...</p>
      <p className="text-white/60 text-sm">AI is detecting pantry items</p>
    </div>
  )
}