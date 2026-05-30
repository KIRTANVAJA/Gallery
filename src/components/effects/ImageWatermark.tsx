interface ImageWatermarkProps {
  className?: string
}

export function ImageWatermark({ className = '' }: ImageWatermarkProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <span
        className="select-none font-display text-[10px] sm:text-xs tracking-[0.5em] text-cream/10 uppercase rotate-[-24deg] scale-150 whitespace-nowrap"
        style={{ userSelect: 'none' }}
      >
        Capture in Silences
      </span>
    </div>
  )
}
