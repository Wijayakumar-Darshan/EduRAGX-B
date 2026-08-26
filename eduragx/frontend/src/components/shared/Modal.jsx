import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-7xl',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  showClose = true,
  closeOnBackdrop = true,
  className = '',
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  // Escape key
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Focus management
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement

    const timer = setTimeout(() => {
      panelRef.current?.focus()
    }, 10)

    return () => {
      clearTimeout(timer)
      previouslyFocused.current?.focus?.()
    }
  }, [open])

  // Focus trap
  useEffect(() => {
    if (!open || !panelRef.current) return

    const panel = panelRef.current
    const focusable = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const trap = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    panel.addEventListener('keydown', trap)
    return () => panel.removeEventListener('keydown', trap)
  }, [open])

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-[#050a0e]/75 backdrop-blur-md"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 16 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.15 }
                : { type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }
            }
            className={`
              relative flex w-full flex-col overflow-hidden rounded-2xl
              border border-forest-800/50 bg-night-950
              shadow-2xl shadow-black/50
              max-h-[90vh] outline-none
              ${WIDTHS[size]} ${className}
            `}
          >
            {/* Soft ambient glows */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-emerald-500/[0.04] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-emerald-500/[0.03] blur-3xl" />

            {/* Header */}
            <header className="relative flex shrink-0 items-center justify-between border-b border-forest-900/50 bg-night-900/40 px-5 py-4 sm:px-6">
              <h2
                id={titleId}
                className="font-display text-base font-semibold tracking-tight text-forest-50 sm:text-lg"
              >
                {title}
              </h2>

              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="
                    group flex h-8 w-8 items-center justify-center rounded-xl
                    text-forest-500 transition-all duration-200
                    hover:bg-forest-900/60 hover:text-forest-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
                  "
                >
                  <X
                    size={17}
                    className="transition-transform duration-300 group-hover:rotate-90"
                  />
                </button>
              )}
            </header>

            {/* Body */}
            <div
              id={descriptionId}
              className="modal-scroll relative flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
            >
              {children}
            </div>

            {/* Optional footer */}
            {footer && (
              <footer className="shrink-0 border-t border-forest-900/50 bg-night-900/30 px-5 py-4 sm:px-6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}