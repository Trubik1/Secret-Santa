import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload, ZoomIn, ZoomOut, RotateCcw, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'

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
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 360, height: 144 })
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

  // Track container dimensions accurately
  useEffect(() => {
    if (!containerRef.current || !isOpen) return

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height })
        }
      }
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [imageSrc, isOpen])

  // Calculate base dimensions (fit container at zoom=1 without empty space)
  const containerAspect =
    containerSize.width > 0 && containerSize.height > 0
      ? containerSize.width / containerSize.height
      : 2.5

  let baseWidth = containerSize.width
  let baseHeight = containerSize.height

  if (naturalSize && naturalSize.width > 0 && naturalSize.height > 0) {
    const imgAspect = naturalSize.width / naturalSize.height
    if (imgAspect > containerAspect) {
      // Wider than container: match height, width extends
      baseHeight = containerSize.height
      baseWidth = baseHeight * imgAspect
    } else {
      // Taller than container: match width, height extends
      baseWidth = containerSize.width
      baseHeight = baseWidth / imgAspect
    }
  }

  const displayWidth = baseWidth * zoom
  const displayHeight = baseHeight * zoom

  // Maximum allowed drag offset to prevent any black/empty gaps
  const maxOffsetX = Math.max(0, (displayWidth - containerSize.width) / 2)
  const maxOffsetY = Math.max(0, (displayHeight - containerSize.height) / 2)

  // Zoom handler with boundary clamping
  const handleZoomChange = (newZoom: number) => {
    const nextZoom = Math.min(2.5, Math.max(1, Math.round(newZoom * 100) / 100))
    setZoom(nextZoom)

    const nextDisplayW = baseWidth * nextZoom
    const nextDisplayH = baseHeight * nextZoom
    const nextMaxX = Math.max(0, (nextDisplayW - containerSize.width) / 2)
    const nextMaxY = Math.max(0, (nextDisplayH - containerSize.height) / 2)

    setOffset((prev) => ({
      x: Math.min(nextMaxX, Math.max(-nextMaxX, prev.x)),
      y: Math.min(nextMaxY, Math.max(-nextMaxY, prev.y)),
    }))
  }

  const handleResetPosition = () => {
    onHaptic?.()
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    onHaptic?.()
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const src = event.target.result
        setImageSrc(src)
        setZoom(1)
        setOffset({ x: 0, y: 0 })

        const img = new Image()
        img.onload = () => {
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = src
      }
    }
    reader.readAsDataURL(file)
  }

  // Pointer / Touch drag handling (1:1 fluid tracking)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imageSrc || !naturalSize) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    }
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch (_) {}
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const rawX = e.clientX - dragStartRef.current.x
    const rawY = e.clientY - dragStartRef.current.y
    setOffset({
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, rawX)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, rawY)),
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  // Smooth wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const step = e.deltaY > 0 ? -0.05 : 0.05
    handleZoomChange(zoom + step)
  }

  // High-Resolution Retina Crop (1200 x 480 at quality 0.92)
  const handleSave = useCallback(async () => {
    if (!imageRef.current || !naturalSize || !containerRef.current || isSaving) return

    setIsSaving(true)
    onHaptic?.()

    try {
      const img = imageRef.current
      const Wc = containerSize.width
      const Hc = containerSize.height
      const Wn = naturalSize.width
      const Hn = naturalSize.height
      const Wd = displayWidth
      const Hd = displayHeight

      // Scale factor from DOM displayed pixels to natural image pixels
      const S = Wn / Wd

      // Visible crop top-left relative to image in DOM coordinates
      const cropX_dom = (Wd - Wc) / 2 - offset.x
      const cropY_dom = (Hd - Hc) / 2 - offset.y

      // Crop coordinates in natural image pixels
      const sx = Math.max(0, Math.min(Wn - 1, cropX_dom * S))
      const sy = Math.max(0, Math.min(Hn - 1, cropY_dom * S))
      const sw = Math.min(Wn - sx, Wc * S)
      const sh = Math.min(Hn - sy, Hc * S)

      // Target high-definition retina banner resolution (2.5 : 1 ratio)
      const targetWidth = 1200
      const targetHeight = 480

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight)

      // High-quality crisp WebP (0.92), fallback to JPEG
      let outputDataUrl = canvas.toDataURL('image/webp', 0.92)
      if (!outputDataUrl.startsWith('data:image/webp')) {
        outputDataUrl = canvas.toDataURL('image/jpeg', 0.92)
      }

      await onSaveCover(outputDataUrl)
      onClose()
    } catch (err) {
      console.error('Failed to crop and save cover:', err)
      alert('Ошибка при сохранении обложки')
    } finally {
      setIsSaving(false)
    }
  }, [naturalSize, containerSize, displayWidth, displayHeight, offset, isSaving, onHaptic, onSaveCover, onClose])

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
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
              className="w-full aspect-[2.5/1] rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-400/60 bg-zinc-900/60 flex flex-col items-center justify-center gap-2 transition-all group active:scale-[0.98] cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
                <Upload size={22} />
              </div>
              <span className="text-xs font-bold text-zinc-300">
                Выбрать фото из галереи
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Viewport Box (2.5:1 ratio, matching Hero banner exactly) */}
            <div className="relative">
              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                className="w-full aspect-[2.5/1] rounded-2xl overflow-hidden bg-black border border-white/20 relative cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center"
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget
                    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
                  }}
                  style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                    transformOrigin: 'center center',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                  }}
                  className="pointer-events-none select-none"
                />

                {/* Subtle Framing Overlay */}
                <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Avatar guide to help the user frame heads/subjects */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full border border-white/40 bg-white/20 backdrop-blur-md flex items-center justify-center text-[9px] font-black text-white pointer-events-none shadow-md">
                  Ава
                </div>
                <div className="absolute bottom-2.5 left-3 text-[10px] font-bold text-white/80 pointer-events-none">
                  Превью баннера
                </div>
              </div>

              {/* Quick Change Button */}
              <button
                type="button"
                onClick={() => {
                  onHaptic?.()
                  fileInputRef.current?.click()
                }}
                className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/10 flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <RefreshCw size={10} />
                <span>Другое фото</span>
              </button>
            </div>

            {/* Clear Intuitive Zoom Controls */}
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="text-[11px] font-semibold text-zinc-400">
                  Масштаб
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleResetPosition}
                    className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    title="Сбросить масштаб и положение"
                  >
                    <RotateCcw size={10} />
                    <span>Сбросить</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onHaptic?.()
                    handleZoomChange(zoom - 0.1)
                  }}
                  disabled={zoom <= 1}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ZoomOut size={13} />
                </button>

                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <button
                  type="button"
                  onClick={() => {
                    onHaptic?.()
                    handleZoomChange(zoom + 0.1)
                  }}
                  disabled={zoom >= 2.5}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1">
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
