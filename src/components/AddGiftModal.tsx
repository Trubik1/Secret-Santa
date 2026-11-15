import React, { useState, useEffect } from 'react'
import { Gift, Priority } from '../types'
import { X, Search, Loader2, Check, AlertCircle, Lock, Unlock } from 'lucide-react'
import { LiquidRadarLoader } from './LiquidRadarLoader'
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
      const [res] = await Promise.all([
        onParseUrl(url.trim()),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#161618] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-base font-black text-white">
            {initialGift ? 'Редактировать желание ✨' : 'Добавить желание 🎁'}
          </h2>
          <button
            onClick={() => {
              onHaptic()
              onClose()
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Smart Link Input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-all font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={handleParse}
                disabled={isParsing || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 shadow-md"
              >
                {isParsing ? <Loader2 size={15} className="animate-spin text-[#c4457b]" /> : <Search size={15} />}
                <span>Найти</span>
              </button>
            </div>

            {/* Exact Pink-Deer-76 Loading Animation */}
            {isParsing && (
              <div className="mt-3 p-3 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl animate-apple-spring">
                <LiquidRadarLoader
                  size="sm"
                  text="поиск товара"
                  subtext="Это может занять немного времени"
                />
              </div>
            )}

            {/* Parse Feedback Status */}
            {parseSuccess && (
              <p className="mt-2 text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                <Check size={13} className="shrink-0" /> Данные товара успешно распознаны!
              </p>
            )}
            {parseError && (
              <p className="mt-2 text-[11px] font-semibold text-amber-400 flex items-center gap-1 animate-fadeIn">
                <AlertCircle size={13} className="shrink-0" /> {parseError}
              </p>
            )}
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Название подарка *
            </label>
            <input
              type="text"
              required
              placeholder="Например, Наушники Sony WH-1000XM5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          {/* Price Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Цена ({currSymbol}) <span className="font-normal text-zinc-500 lowercase">(необязательно)</span>
              </label>

              {isPriceLocked && (
                <button
                  type="button"
                  onClick={() => setIsPriceLocked(false)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-300 hover:text-white hover:underline"
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
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-none transition-all ${
                  isPriceLocked
                    ? 'bg-zinc-900/60 border border-white/5 text-zinc-400 cursor-not-allowed'
                    : 'bg-zinc-900 border border-white/10 focus:border-white/30'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">
                {isPriceLocked ? <Lock size={13} className="text-zinc-400" /> : currSymbol}
              </span>
            </div>

            {isPriceLocked && (
              <p className="mt-1 text-[10px] text-zinc-400 flex items-center gap-1">
                <Lock size={10} className="text-zinc-400" /> Цена подтянута с маркетплейса
              </p>
            )}
          </div>

          {/* Description / Notes field */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Заметки и пожелания <span className="font-normal text-zinc-500 lowercase">(размер, цвет и т.д.)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Например: цвет только бежевый, размер M"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-all resize-none font-medium"
            />
          </div>

          {/* Image URL with preview */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Прямая ссылка на фото
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://... (ссылка на картинку)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-all font-medium"
              />
              {imageUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                  <img src={imageUrl} alt="Превью" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Приоритет
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: 'Хочу 👍' },
                { val: 2, label: 'Очень хочу 🔥' },
                { val: 3, label: 'Мечта ✨' },
              ].map((p) => {
                const isSelected = priority === p.val
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      onHaptic()
                      setPriority(p.val as Priority)
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center active:scale-95 ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-sm font-black'
                        : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form error notification */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black active:scale-95 shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
