import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmText: string
  loading?: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

const CLOSE_TRANSITION_MS = 180

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [isMounted, setIsMounted] = useState(open)
  const [isVisible, setIsVisible] = useState(open)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBusy = loading || isSubmitting

  useEffect(() => {
    if (open) {
      setIsMounted(true)

      const animationFrameId = window.requestAnimationFrame(() => {
        setIsVisible(true)
      })

      return () => window.cancelAnimationFrame(animationFrameId)
    }

    setIsVisible(false)
  }, [open])

  useEffect(() => {
    if (open || !isMounted) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsMounted(false)
    }, CLOSE_TRANSITION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isMounted, open])

  useEffect(() => {
    if (!isMounted) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMounted])

  useEffect(() => {
    if (!isMounted) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isBusy, isMounted, onCancel])

  if (!isMounted) {
    return null
  }

  const handleConfirm = async () => {
    if (isBusy) {
      return
    }

    setIsSubmitting(true)

    try {
      await onConfirm()
    } catch (error) {
      console.error('Error confirming action:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 pt-10 transition-opacity duration-200 sm:items-center sm:px-6 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        aria-label="Fermer la fenêtre de confirmation"
        className="absolute inset-0 bg-stone-950/55"
        disabled={isBusy}
        onClick={onCancel}
        type="button"
      />

      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_28px_80px_rgba(17,17,17,0.24)] transition duration-200 sm:p-6 ${
          isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 sm:translate-y-2'
        }`}
        role="dialog"
      >
        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500"
          >
            Confirmation
          </p>
          <h2
            className="font-serif text-2xl font-semibold tracking-tight text-stone-950"
            id={titleId}
          >
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-6 text-stone-600" id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            autoFocus
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={onCancel}
            type="button"
          >
            Annuler
          </button>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={() => {
              void handleConfirm()
            }}
            type="button"
          >
            {isBusy ? `${confirmText}...` : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
