

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog */}
      <div className="relative z-10 bg-charcoal border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-display text-lg font-bold text-white mb-2">{title}</h2>
        <p className="font-mono text-sm text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 bg-background border border-border text-muted-foreground font-mono text-sm py-2.5 rounded-xl hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-pink/10 border border-pink/40 hover:border-pink text-pink font-mono text-sm py-2.5 rounded-xl transition-all hover:bg-pink/20 disabled:opacity-50"
          >
            {loading && (
              <svg
                className="animate-spin h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
