import React from 'react'
import { Plus, Share2, Sparkles } from 'lucide-react'

interface StickyActionBarProps {
  isOwner: boolean
  onAddGift: () => void
  onShare: () => void
  onCreateOwn: () => void
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  isOwner,
  onAddGift,
  onShare,
  onCreateOwn,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 px-4 backdrop-blur-lg bg-bg-light/85 dark:bg-bg-dark/85 border-t border-border-soft/50 dark:border-border-soft-dark/50">
      <div className="max-w-md mx-auto flex items-center gap-2.5">
        {isOwner ? (
          <>
            {/* Primary Add Gift Button */}
            <button
              onClick={onAddGift}
              className="flex-1 h-12 py-3 px-5 rounded-full bg-accent-rose text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-accent-rose/30 active-press hover:bg-accent-rose-hover transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Добавить подарок</span>
            </button>

            {/* Share Wishlist Button */}
            <button
              onClick={onShare}
              className="h-12 w-12 rounded-full bg-surface-card dark:bg-surface-card-dark text-ink-light dark:text-ink-dark border border-border-soft dark:border-border-soft-dark flex items-center justify-center shadow-sm active-press hover:text-accent-rose transition-all shrink-0"
              title="Поделиться вишлистом"
            >
              <Share2 size={17} />
            </button>
          </>
        ) : (
          <button
            onClick={onCreateOwn}
            className="w-full h-12 py-3 px-5 rounded-full bg-accent-rose text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-accent-rose/30 active-press hover:bg-accent-rose-hover transition-all"
          >
            <Sparkles size={17} />
            <span>Создать свой вишлист бесплатно</span>
          </button>
        )}
      </div>
    </div>
  )
}
