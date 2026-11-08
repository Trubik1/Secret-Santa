import React, { useState, useEffect } from 'react'
import { Gift, CategoryId, Priority } from '../types'
import { X, Search, Loader2, Sparkles, Image, Link, Check } from 'lucide-react'

interface AddGiftModalProps {
  isOpen: boolean
  initialGift?: Gift | null
  onClose: () => void
  onSave: (giftData: Partial<Gift>) => Promise<void>
  onParseUrl: (url: string) => Promise<{ title: string; imageUrl: string; price: number; parsed: boolean }>
  onHaptic: () => void
}

const CATEGORIES: { id: CategoryId; title: string }[] = [
  { id: 'gadgets', title: 'Гаджеты' },
  { id: 'clothes', title: 'Одежда' },
  { id: 'home', title: 'Для дома' },
  { id: 'books', title: 'Книги' },
  { id: 'other', title: 'Другое' },
]

export const AddGiftModal: React.FC<AddGiftModalProps> = ({
  isOpen,
  initialGift,
  onClose,
  onSave,
  onParseUrl,
  onHaptic,
}) => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId>('other')
  const [priority, setPriority] = useState<Priority>(1)
  const [isCrowdfund, setIsCrowdfund] = useState(false)
  const [targetAmount, setTargetAmount] = useState('')

  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseSuccess, setParseSuccess] = useState(false)

  useEffect(() => {
    if (initialGift) {
      setTitle(initialGift.title || '')
      setPrice(initialGift.price ? String(initialGift.price) : '')
      setUrl(initialGift.url || '')
      setImageUrl(initialGift.imageUrl || '')
      setCategoryId((initialGift.categoryId as CategoryId) || 'other')
      setPriority(initialGift.priority || 1)
      setIsCrowdfund(Boolean(initialGift.isCrowdfund))
      setTargetAmount(initialGift.targetAmount ? String(initialGift.targetAmount) : '')
    } else {
      // Reset defaults
      setTitle('')
      setPrice('')
      setUrl('')
      setImageUrl('')
      setCategoryId('other')
      setPriority(1)
      setIsCrowdfund(false)
      setTargetAmount('')
      setParseSuccess(false)
    }
  }, [initialGift, isOpen])

  if (!isOpen) return null

  const handleParse = async () => {
    if (!url.trim()) return
    setIsParsing(true)
    setParseSuccess(false)
    onHaptic()
    try {
      const res = await onParseUrl(url.trim())
      if (res.title) setTitle(res.title)
      if (res.price) {
        setPrice(String(res.price))
        if (isCrowdfund) setTargetAmount(String(res.price))
      }
      if (res.imageUrl) setImageUrl(res.imageUrl)
      setParseSuccess(true)
    } catch (err) {
      console.warn('Parser failed:', err)
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    onHaptic()
    try {
      const parsedPrice = parseInt(price, 10) || 0
      const parsedTarget = isCrowdfund ? (parseInt(targetAmount, 10) || parsedPrice) : 0

      await onSave({
        title: title.trim(),
        price: parsedPrice,
        url: url.trim() || null,
        imageUrl: imageUrl.trim() || null,
        categoryId,
        priority,
        isCrowdfund,
        targetAmount: parsedTarget,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-bg-light dark:bg-bg-dark rounded-t-32 sm:rounded-32 p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-border-soft dark:border-border-soft-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-soft dark:border-border-soft-dark">
          <h2 className="text-lg font-extrabold text-ink-light dark:text-ink-dark">
            {initialGift ? 'Редактировать желание' : 'Добавить желание 🎁'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card dark:hover:bg-surface-card-dark text-ink-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Link parser section */}
          <div>
            <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
              Ссылка на товар (Ozon, WB, маркетплейсы)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Link size={15} />
                </span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-xs text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose"
                />
              </div>
              <button
                type="button"
                onClick={handleParse}
                disabled={!url.trim() || isParsing}
                className="px-4 py-2.5 rounded-2xl bg-accent-rose text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 active-press shrink-0 shadow-sm shadow-accent-rose/20"
              >
                {isParsing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : parseSuccess ? (
                  <Check size={14} />
                ) : (
                  <Search size={14} />
                )}
                <span>{isParsing ? 'Поиск...' : 'Найти'}</span>
              </button>
            </div>
            {parseSuccess && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Sparkles size={12} />
                Данные товара успешно подтянуты!
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
              Название подарка *
            </label>
            <input
              type="text"
              required
              placeholder="Например, Беспроводные наушники"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose font-medium"
            />
          </div>

          {/* Price & Category Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                Цена (₽)
              </label>
              <input
                type="number"
                min="0"
                placeholder="4 990"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value)
                  if (isCrowdfund && !targetAmount) {
                    setTargetAmount(e.target.value)
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                Категория
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value as CategoryId)}
                className="w-full px-3 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm text-ink-light dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-accent-rose font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL preview */}
          <div>
            <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
              Ссылка на фото
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Image size={15} />
                </span>
                <input
                  type="url"
                  placeholder="https://... (прямая ссылка на картинку)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-xs text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose"
                />
              </div>
              {imageUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-soft border border-border-soft shrink-0">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
              Приоритет
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1 as Priority, label: 'Хочу 👍' },
                { val: 2 as Priority, label: 'Очень хочу 🔥' },
                { val: 3 as Priority, label: 'Мечта ✨' },
              ].map((p) => {
                const isSelected = priority === p.val
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setPriority(p.val)}
                    className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all active-press border ${
                      isSelected
                        ? 'bg-accent-rose text-white border-accent-rose shadow-sm'
                        : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted border-border-soft dark:border-border-soft-dark'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Crowdfunding toggle */}
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl bg-surface-soft dark:bg-surface-soft-dark border border-border-soft dark:border-border-soft-dark flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-light dark:text-ink-dark">
                  Разрешить скинуться 🤝
                </p>
                <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                  Для дорогих подарков — друзья смогут собрать сумму вместе
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={isCrowdfund}
                  onChange={(e) => {
                    setIsCrowdfund(e.target.checked)
                    if (e.target.checked && !targetAmount) {
                      setTargetAmount(price || '0')
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-rose" />
              </label>
            </div>

            {isCrowdfund && (
              <div className="mt-3 animate-fade-in">
                <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                  Целевая сумма сбора (₽)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Например, 45 000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose font-medium"
                />
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full h-13 py-3.5 rounded-full bg-accent-rose text-white text-sm font-extrabold active-press shadow-lg shadow-accent-rose/25 hover:bg-accent-rose-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span>{initialGift ? 'Сохранить изменения' : 'Добавить в вишлист ✨'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
