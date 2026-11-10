import React, { useState, useEffect } from 'react'
import { Gift, Priority } from '../types'
import { X, Search, Loader2, Check, AlertCircle, Lock, Unlock } from 'lucide-react'
import {
  CurrencyMode,
  getCurrencySymbol,
  convertRubTo,
  convertToRub,
  MAX_LIMITS,
} from '../utils/currency'

interface AddGiftModalProps {
  isOpen: boolean
  initialGift?: Gift | null
  currencyMode: CurrencyMode
  onClose: () => void
  onSave: (giftData: Partial<Gift>) => Promise<void>
  onParseUrl: (url: string) => Promise<{ title: string; imageUrl: string; price: number; categoryId?: string; parsed: boolean }>
  onHaptic: () => void
}

export const AddGiftModal: React.FC<AddGiftModalProps> = ({
  isOpen,
  initialGift,
  currencyMode,
  onClose,
  onSave,
  onParseUrl,
  onHaptic,
}) => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [priority, setPriority] = useState<Priority>(1)

  // Price lock for auto-parsed items to prevent accidental edits
  const [isPriceLocked, setIsPriceLocked] = useState(false)

  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parseSuccess, setParseSuccess] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const currSymbol = getCurrencySymbol(currencyMode)
  const maxLimit = MAX_LIMITS[currencyMode] || 5000

  useEffect(() => {
    if (initialGift) {
      setTitle(initialGift.title || '')
      const convertedPrice = initialGift.price ? convertRubTo(initialGift.price, currencyMode) : ''
      setPrice(convertedPrice ? String(convertedPrice) : '')
      setDescription(initialGift.description || '')
      setUrl(initialGift.url || '')
      setImageUrl(initialGift.imageUrl || '')
      setPriority(initialGift.priority || 1)
      setIsPriceLocked(false)
      setParseSuccess(false)
      setParseError(null)
      setFormError(null)
    } else {
      setTitle('')
      setPrice('')
      setDescription('')
      setUrl('')
      setImageUrl('')
      setPriority(1)
      setIsPriceLocked(false)
      setParseSuccess(false)
      setParseError(null)
      setFormError(null)
    }
  }, [initialGift, isOpen, currencyMode])

  if (!isOpen) return null

  const handleParse = async () => {
    if (!url.trim()) return
    setIsParsing(true)
    setParseSuccess(false)
    setParseError(null)
    setFormError(null)
    onHaptic()
    try {
      const res = await onParseUrl(url.trim())
      if (res && res.parsed && (res.title || res.price || res.imageUrl)) {
        if (res.title) setTitle(res.title)
        if (res.price) {
          const converted = convertRubTo(res.price, currencyMode)
          setPrice(String(converted))
          setIsPriceLocked(true) // Lock price from accidental modification
        }
        if (res.imageUrl) setImageUrl(res.imageUrl)
        setParseSuccess(true)
      } else {
        setParseError('Не удалось автоматически извлечь данные. Заполните поля ниже вручную.')
      }
    } catch (err: any) {
      setParseError(err.message || 'Ошибка загрузки данных по ссылке')
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setFormError(null)
    const rawNum = parseFloat(price.replace(',', '.')) || 0

    // Price limit check (equivalent of $5,000 max)
    if (rawNum > maxLimit) {
      setFormError(`Цена не может превышать ${maxLimit.toLocaleString('ru-RU')} ${currSymbol} (эквивалент $5 000).`)
      onHaptic()
      return
    }

    setIsSubmitting(true)
    onHaptic()
    try {
      const parsedPriceInRub = rawNum > 0 ? convertToRub(rawNum, currencyMode) : 0

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
        currency: 'RUB',
        description: description.trim() || null,
        url: cleanUrl || null,
        imageUrl: cleanImg || null,
        priority,
        isCrowdfund: false, // Crowdfunding is dynamic for friends on items >= 3000 RUB
      })
      onClose()
    } catch (err: any) {
      setFormError(err.message || 'Не удалось сохранить подарок')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-card dark:bg-[#17171a] border-t sm:border border-border-soft dark:border-[#34252f] rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-base font-black text-ink-light dark:text-white">
            {initialGift ? 'Редактировать желание ✨' : 'Добавить желание 🎁'}
          </h2>
          <button
            onClick={() => {
              onHaptic()
              onClose()
            }}
            className="p-1.5 rounded-full text-ink-muted hover:text-ink-light dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Smart Link Input */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1.5">
              Ссылка на товар (Wildberries, Ozon и др.)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="url"
                  placeholder="https://wildberries.by/catalog/..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setParseSuccess(false)
                    setParseError(null)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 text-xs text-ink-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#c4457b] transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleParse}
                disabled={isParsing || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-bold active-press disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
              >
                {isParsing ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                <span>Найти</span>
              </button>
            </div>

            {/* Parse Feedback Status */}
            {parseSuccess && (
              <p className="mt-1.5 text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                <Check size={12} /> Данные товара успешно распознаны!
              </p>
            )}
            {parseError && (
              <p className="mt-1.5 text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                <AlertCircle size={12} /> {parseError}
              </p>
            )}
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1.5">
              Название подарка *
            </label>
            <input
              type="text"
              required
              placeholder="Например, Наушники Sony WH-1000XM5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 text-xs font-semibold text-ink-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#c4457b] transition-all"
            />
          </div>

          {/* Price Field (Single currency, optional, locked if auto-parsed) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                Цена ({currSymbol}) <span className="font-normal text-zinc-500 lowercase">(необязательно)</span>
              </label>

              {isPriceLocked && (
                <button
                  type="button"
                  onClick={() => setIsPriceLocked(false)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c4457b] hover:underline"
                >
                  <Unlock size={11} /> Изменить цену
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                max={maxLimit}
                disabled={isPriceLocked}
                placeholder="Без цены (или введите сумму)"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value)
                  setFormError(null)
                }}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs font-bold text-ink-light dark:text-white placeholder:text-zinc-500 focus:outline-none transition-all ${
                  isPriceLocked
                    ? 'bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-400 cursor-not-allowed'
                    : 'bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 focus:border-[#c4457b]'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-ink-muted">
                {isPriceLocked ? <Lock size={13} className="text-[#c4457b]" /> : currSymbol}
              </span>
            </div>

            {isPriceLocked && (
              <p className="mt-1 text-[10px] text-zinc-400 flex items-center gap-1">
                <Lock size={10} className="text-[#c4457b]" /> Цена подтянута с маркетплейса и заблокирована от случайных изменений
              </p>
            )}
          </div>

          {/* Description / Notes field */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1.5">
              Заметки и пожелания <span className="font-normal text-zinc-500 lowercase">(размер, цвет и т.д.)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Например: цвет только бежевый, размер M или ссылка на видеообзор"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 text-xs text-ink-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#c4457b] transition-all resize-none"
            />
          </div>

          {/* Image URL with preview */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1.5">
              Прямая ссылка на фото
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://... (ссылка на картинку)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 text-xs text-ink-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#c4457b] transition-all"
              />
              {imageUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
                  <img src={imageUrl} alt="Превью" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1.5">
              Приоритет
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: 'Хочу 👍', active: 'bg-emerald-950/40 border-emerald-500 text-emerald-300' },
                { val: 2, label: 'Очень хочу 🔥', active: 'bg-amber-950/40 border-amber-500 text-amber-300' },
                { val: 3, label: 'Мечта ✨', active: 'bg-[#241920] border-[#c4457b] text-[#d98aab]' },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => {
                    onHaptic()
                    setPriority(p.val as Priority)
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                    priority === p.val
                      ? `${p.active} shadow-sm font-black`
                      : 'border-border-soft dark:border-zinc-800 text-ink-muted hover:text-ink-light dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form error notification */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full py-3.5 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black active-press shadow-lg shadow-[#c4457b]/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
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
