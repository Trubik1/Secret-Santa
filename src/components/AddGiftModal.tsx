import React, { useState, useEffect } from 'react'
import { Gift, CategoryId, Priority } from '../types'
import { X, Search, Loader2, Sparkles, Image, Link, Check, AlertCircle } from 'lucide-react'
import { formatByn, formatRub, rubToByn, bynToRub } from '../utils/currency'

interface AddGiftModalProps {
  isOpen: boolean
  initialGift?: Gift | null
  onClose: () => void
  onSave: (giftData: Partial<Gift>) => Promise<void>
  onParseUrl: (url: string) => Promise<{ title: string; imageUrl: string; price: number; categoryId?: string; parsed: boolean }>
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
  const [inputCurrency, setInputCurrency] = useState<'rub' | 'byn'>('rub')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId>('other')
  const [priority, setPriority] = useState<Priority>(1)
  const [isCrowdfund, setIsCrowdfund] = useState(false)

  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseSuccess, setParseSuccess] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    if (initialGift) {
      setTitle(initialGift.title || '')
      setPrice(initialGift.price ? String(initialGift.price) : '')
      setInputCurrency('rub')
      setUrl(initialGift.url || '')
      setImageUrl(initialGift.imageUrl || '')
      setCategoryId((initialGift.categoryId as CategoryId) || 'other')
      setPriority(initialGift.priority || 1)
      setIsCrowdfund(Boolean(initialGift.isCrowdfund))
      setParseSuccess(false)
      setParseError(null)
    } else {
      setTitle('')
      setPrice('')
      setInputCurrency('rub')
      setUrl('')
      setImageUrl('')
      setCategoryId('other')
      setPriority(1)
      setIsCrowdfund(false)
      setParseSuccess(false)
      setParseError(null)
    }
  }, [initialGift, isOpen])

  if (!isOpen) return null

  const handleParse = async () => {
    if (!url.trim()) return
    setIsParsing(true)
    setParseSuccess(false)
    setParseError(null)
    onHaptic()
    try {
      const res = await onParseUrl(url.trim())
      if (res && res.parsed && (res.title || res.price || res.imageUrl)) {
        if (res.title) setTitle(res.title)
        if (res.price) {
          setInputCurrency('rub')
          setPrice(String(res.price))
        }
        if (res.imageUrl) setImageUrl(res.imageUrl)
        if (res.categoryId && CATEGORIES.some(c => c.id === res.categoryId)) {
          setCategoryId(res.categoryId as CategoryId)
        }
        setParseSuccess(true)
      } else {
        setParseError('Данные не распознаны автоматически. Пожалуйста, заполните поля ниже вручную.')
      }
    } catch (err: any) {
      setParseError(err.message || 'Ошибка парсинга ссылки')
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
      const rawNum = parseFloat(price) || 0
      const parsedPriceInRub = inputCurrency === 'byn' ? bynToRub(rawNum) : Math.round(rawNum)

      let cleanUrl = url.trim()
      if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`
      }

      let cleanImg = imageUrl.trim()
      if (cleanImg && cleanImg.startsWith('//')) {
        cleanImg = `https:${cleanImg}`
      }

      await onSave({
        title: title.trim(),
        price: parsedPriceInRub,
        url: cleanUrl || null,
        imageUrl: cleanImg || null,
        categoryId,
        priority,
        isCrowdfund,
        // Target amount is automatically the gift's price
        targetAmount: isCrowdfund ? parsedPriceInRub : 0,
      })
      onClose()
    } catch (err) {
      console.error('Error saving gift:', err)
      // Close anyway if item was actually saved or handled
      onClose()
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
              Ссылка на товар (Ozon, Wildberries, маркетплейсы)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Link size={15} />
                </span>
                <input
                  type="text"
                  inputMode="url"
                  placeholder="https://www.wildberries.ru/catalog/..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setParseSuccess(false)
                    setParseError(null)
                  }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-xs text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose"
                />
              </div>
              <button
                type="button"
                onClick={handleParse}
                disabled={!url.trim() || isParsing}
                className="px-4 py-2.5 rounded-2xl bg-accent-rose text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 active-press shrink-0 shadow-sm shadow-accent-rose/20 hover:bg-accent-rose-hover transition-all"
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
            {parseError && (
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{parseError}</span>
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

          {/* Price input with live currency toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">
                Цена подарка *
              </label>
              <div className="flex rounded-lg bg-surface-soft dark:bg-surface-soft-dark p-0.5 border border-border-soft dark:border-border-soft-dark text-[10px] font-extrabold">
                <button
                  type="button"
                  onClick={() => {
                    onHaptic()
                    if (inputCurrency === 'byn' && price) {
                      const converted = bynToRub(parseFloat(price) || 0)
                      setPrice(converted ? String(converted) : '')
                    }
                    setInputCurrency('rub')
                  }}
                  className={`px-2 py-0.5 rounded transition-all ${
                    inputCurrency === 'rub'
                      ? 'bg-accent-rose text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink-light'
                  }`}
                >
                  ₽ RUB
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onHaptic()
                    if (inputCurrency === 'rub' && price) {
                      const converted = rubToByn(parseFloat(price) || 0)
                      setPrice(converted ? String(converted) : '')
                    }
                    setInputCurrency('byn')
                  }}
                  className={`px-2 py-0.5 rounded transition-all ${
                    inputCurrency === 'byn'
                      ? 'bg-accent-rose text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink-light'
                  }`}
                >
                  Br BYN
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              required
              placeholder={inputCurrency === 'rub' ? '4 990 ₽' : '170 Br'}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose font-medium"
            />
            {/* Converted currency hint */}
            {parseFloat(price) > 0 && (
              <p className="mt-1 text-[11px] font-bold text-accent-rose">
                ≈{' '}
                {inputCurrency === 'rub'
                  ? `${formatByn(parseFloat(price), true)} (бел. руб.)`
                  : `${formatRub(bynToRub(parseFloat(price)))}`}
              </p>
            )}
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
                  type="text"
                  inputMode="url"
                  placeholder="https://... (прямая ссылка на картинку)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-xs text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose"
                />
              </div>
              {imageUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-soft border border-border-soft shrink-0">
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none'
                    }}
                  />
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

          {/* Crowdfunding toggle with high contrast switch */}
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl bg-surface-soft dark:bg-surface-soft-dark border border-border-soft dark:border-border-soft-dark flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-light dark:text-ink-dark flex items-center gap-1.5">
                  <span>Разрешить скинуться</span>
                  <span>🤝</span>
                </p>
                <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark mt-0.5">
                  Для дорогих подарков — цель сбора автоматически равна стоимости
                </p>
              </div>

              {/* High Contrast Visible Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isCrowdfund}
                onClick={() => {
                  onHaptic()
                  setIsCrowdfund(!isCrowdfund)
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                  isCrowdfund
                    ? 'bg-accent-rose shadow-md shadow-accent-rose/30'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isCrowdfund ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isCrowdfund && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-xs font-bold text-accent-rose dark:text-accent-rose-dark flex items-center justify-between animate-fade-in">
                <span>🎯 Цель сбора:</span>
                <span>{price ? `${parseInt(price, 10).toLocaleString('ru-RU')} ₽` : 'Укажите цену подарка выше'}</span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full h-12 py-3 rounded-full bg-accent-rose text-white text-sm font-extrabold active-press shadow-lg shadow-accent-rose/25 hover:bg-accent-rose-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
