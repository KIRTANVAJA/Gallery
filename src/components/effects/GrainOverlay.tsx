import { useAdminAccess } from '../../context/AdminAccessContext'

export function GrainOverlay() {
  const { holdProgress } = useAdminAccess()

  return (
    <div
      className="grain-overlay"
      style={{
        opacity: `calc(var(--grain-opacity) + ${holdProgress * 0.4})`,
      }}
      aria-hidden="true"
    />
  )
}
