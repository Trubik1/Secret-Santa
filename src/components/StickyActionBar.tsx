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
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 safe-bottom pointer-events-none">
      <div className="max-w-md mx-auto flex items-center gap-3 pointer-events-auto">
        {isOwner ? (
          <>
            {/* Add Gift Button */}
            <button
              onClick={onAddGift}
              className="flex-1 h-13 py-3.5 px-6 rounded-full bg-accent-rose text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-accent-rose/30 active-press hover:bg-accent-rose-hover transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Добавить подарок</span>
            </button>

            {/* Share Wishlist Button */}
            <button
              onClick={onShare}
              className="h-13 py-3.5 px-5 rounded-full bg-surface-card dark:bg-surface-card-dark text-ink-light dark:text-ink-dark border border-border-soft dark:border-border-soft-dark text-sm font-bold flex items-center justify-center gap-2 shadow-lg active-press hover:text-accent-rose transition-all"
              title="Поделиться вишлистом"
            >
              <Share2 size={18} />
              <span className="hidden sm:inline">Поделиться</span>
            </button>
          </>
        ) : (
          <button
            onClick={onCreateOwn}
            className="w-full h-13 py-3.5 px-6 rounded-full bg-accent-rose text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-accent-rose/30 active-press hover:bg-accent-rose-hover transition-all"
          >
            <Sparkles size={18} />
            <span>Создать свой вишлист бесплатно</span>
          </button>
        )}
      </div>
    </div>
  )
}
