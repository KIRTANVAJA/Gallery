import type { PhotoExif } from '../../types/photo'

interface ExifPanelProps {
  exif?: PhotoExif
  camera?: string
  lens?: string
}

export function ExifPanel({ exif, camera, lens }: ExifPanelProps) {
  const displayCamera = exif?.camera || camera
  const displayLens = exif?.lens || lens

  if (!displayCamera && !exif?.iso) return null

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <p className="font-body text-[10px] tracking-[0.3em] text-gold uppercase mb-4">
        Capture Details
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-body text-xs text-cream-muted">
        {displayCamera && (
          <div>
            <span className="block text-cream-muted/60 uppercase tracking-wider mb-1">Camera</span>
            <span className="text-cream">{displayCamera}</span>
          </div>
        )}
        {displayLens && (
          <div>
            <span className="block text-cream-muted/60 uppercase tracking-wider mb-1">Lens</span>
            <span className="text-cream">{displayLens}</span>
          </div>
        )}
        {exif?.aperture && (
          <div>
            <span className="block text-cream-muted/60 uppercase tracking-wider mb-1">Aperture</span>
            <span className="text-cream">{exif.aperture}</span>
          </div>
        )}
        {exif?.shutterSpeed && (
          <div>
            <span className="block text-cream-muted/60 uppercase tracking-wider mb-1">Shutter</span>
            <span className="text-cream">{exif.shutterSpeed}</span>
          </div>
        )}
        {exif?.iso && (
          <div>
            <span className="block text-cream-muted/60 uppercase tracking-wider mb-1">ISO</span>
            <span className="text-cream">{exif.iso}</span>
          </div>
        )}
        {exif?.focalLength && (
          <div>
            <span className="block text-cream-muted/60 uppercase tracking-wider mb-1">Focal</span>
            <span className="text-cream">{exif.focalLength}</span>
          </div>
        )}
      </div>
    </div>
  )
}
