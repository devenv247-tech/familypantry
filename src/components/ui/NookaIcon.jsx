export default function NookaIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="14" fill="#1a73e8"/>
      <rect x="12" y="13" width="7" height="28" rx="3.5" fill="white"/>
      <rect x="41" y="13" width="7" height="28" rx="3.5" fill="white"/>
      <rect x="15" y="17" width="21" height="7" rx="3.5" fill="white" transform="rotate(30 15 17)"/>
      <circle cx="49" cy="10" r="6" fill="#34d399"/>
      <circle cx="49" cy="10" r="3.5" fill="white" opacity="0.9"/>
    </svg>
  )
}
