import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload, ZoomOut, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface CoverCropModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveCover: (croppedDataUrl: string) => Promise<void>
  onHaptic?: () => void
}

export const CoverCropModal: React.FC<CoverCropModalProps> = ({
  isOpen,
  onClose,
  onSaveCover,
  onHaptic,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setIsSaving(false)
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    onHaptic?.()
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageSrc(event.target.result)
        setZoom(1)
        setOffset({ x: 0, y: 0 })
      }
    }
    reader.readAsDataURL(file)
  }

  // Pointer / Touch drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imageSrc) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  // Perform client-side canvas crop & WebP compression (~800x320 px, ~40 KB)
  const handleSave = useCallback(async () => {
    if (!imageRef.current || !containerRef.current || isSaving) return

    setIsSaving(true)
    onHaptic?.()

    try {
      const img = imageRef.current
      const container = containerRef.current
      const rect = container.getBoundingClientRect()

      // Target banner resolution: 800 x 320 (2.5 : 1 ratio)
      const targetWidth = 800
      const targetHeight = 320

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      // Calculate source crop coordinates based on zoom & offset
      const containerAspect = rect.width / rect.height
      const imgAspect = img.naturalWidth / img.naturalHeight

      let baseWidth: number
      let baseHeight: number
      if (imgAspect > containerAspect) {
        baseHeight = rect.height
        baseWidth = baseHeight * imgAspect
      } else {
        baseWidth = rect.width
        baseHeight = baseWidth / imgAspect
      }

      const currentWidth = baseWidth * zoom
      const currentHeight = baseHeight * zoom

      // Center of container in image space
      const scaleX = img.naturalWidth / currentWidth
      const scaleY = img.naturalHeight / currentHeight

      const imgLeftOnContainer = (rect.width - currentWidth) / 2 + offset.x
      const imgTopOnContainer = (rect.height - currentHeight) / 2 + offset.y

      const cropX = Math.max(0, -imgLeftOnContainer * scaleX)
      const cropY = Math.max(0, -imgTopOnContainer * scaleY)
      const cropW = Math.min(img.naturalWidth - cropX, rect.width * scaleX)
      const cropH = Math.min(img.naturalHeight - cropY, rect.height * scaleY)

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetWidth, targetHeight)

      // Compress to high-efficiency WebP (quality 0.82)
      const webpDataUrl = canvas.toDataURL('image/webp', 0.82)

      await onSaveCover(webpDataUrl)
      onClose()
    } catch (err) {
      console.error('Failed to crop and save cover:', err)
      alert('Ошибка при сохранении обложки')
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, onHaptic, onSaveCover, onClose, zoom, offset])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-white">
                Обложка вишлиста
              </h2>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Giftly Premium
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onHaptic?.()
              onClose()
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload / Cropper Viewport */}
        {!imageSrc ? (
          <div className="mt-5">
            <button
              onClick={() => {
                onHaptic?.()
                fileInputRef.current?.click()
              }}
              className="w-full aspect-[2.5/1] rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-400/60 bg-zinc-900/60 flex flex-col items-center justify-center gap-2 transition-all group active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
                <Upload size={22} />
              </div>
              <span className="text-xs font-bold text-zinc-300">
                Выбрать фото из галереи
              </span>
              <span className="text-[10px] text-zinc-500">
                Оптимизируется до лёгких 40 КБ в формате WebP
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Viewport Box (2.5:1 ratio, exactly matching Hero card) */}
            <div className="relative">
              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full aspect-[2.5/1] rounded-2xl overflow-hidden bg-black border border-white/20 relative cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center"
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    maxHeight: 'none',
                    maxWidth: 'none',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                  className="pointer-events-none select-none"
                />

                {/* Grid Overlay / Guide */}
                <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                {/* Avatar preview placeholder to help framing */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full border border-white/40 bg-white/20 backdrop-blur-md flex items-center justify-center text-[9px] font-black text-white pointer-events-none shadow-md">
                  Ава
                </div>
                <div className="absolute bottom-2.5 left-3 text-[10px] font-bold text-white/80 pointer-events-none">
                  Превью баннера
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onHaptic?.()
                  fileInputRef.current?.click()
                }}
                className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/10 flex items-center gap-1 active:scale-95"
              >
                <RefreshCw size={10} />
                <span>Другое фото</span>
              </button>
            </div>

            {/* Zoom Slider */}
            <div className="px-1 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <ZoomOut size={13} />
                  <span>Масштаб</span>
                </span>
                <span className="text-[11px] text-zinc-300 font-mono">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <p className="text-[10px] text-zinc-500 text-center pt-0.5">
                Передвигайте фото пальцем для идеального ракурса
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black active:scale-95 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin text-black" />
                ) : (
                  <>
                    <Check size={16} strokeWidth={3} />
                    <span>Применить обложку</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
