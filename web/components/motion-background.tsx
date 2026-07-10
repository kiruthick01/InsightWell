'use client'

export function MotionBackground() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        animation: prefersReducedMotion ? 'none' : undefined,
      }}
    >
      {/* Conic gradient radar sweep */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          background: 'conic-gradient(from 0deg, #F2A93B 0%, #35D9C6 25%, transparent 50%, #F2A93B 100%)',
          animation: prefersReducedMotion ? 'none' : 'spin 20s linear infinite',
        }}
      />

      {/* Soft blurred amber blob */}
      <div
        className="absolute -top-20 -left-32 w-96 h-96 bg-[#F2A93B] rounded-full blur-[120px] opacity-[0.12]"
        style={{
          animation: prefersReducedMotion
            ? 'none'
            : 'float 25s ease-in-out infinite',
        }}
      />

      {/* Soft blurred cyan blob */}
      <div
        className="absolute -bottom-20 -right-40 w-96 h-96 bg-[#35D9C6] rounded-full blur-[120px] opacity-[0.12]"
        style={{
          animation: prefersReducedMotion
            ? 'none'
            : 'float 28s ease-in-out infinite reverse',
        }}
      />

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-30px) translateX(20px);
          }
          50% {
            transform: translateY(-60px) translateX(-20px);
          }
          75% {
            transform: translateY(-30px) translateX(-40px);
          }
        }
      `}</style>
    </div>
  )
}
