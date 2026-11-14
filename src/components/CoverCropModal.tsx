import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload, Check, Loader2, Sparkles, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'

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
  const [scale, setScale] = useState<number>(1)
  const [minScale, setMinScale] = useState<number>(1)
  const [maxScale, setMaxScale] = useState<number>(4)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>({ width: 320, height: 128 })

  // Touch & Pointer gesture tracking
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
  })

  // Pinch-to-zoom tracking
  const pinchStartRef = useRef<{ dist: number; scale: number } | null>(null)

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setIsSaving(false)
    }
  }, [isOpen])

  // Measure crop frame size inside the viewport
  const updateFrameDimensions = useCallback(() => {
    if (frameRef.current) {
      const rect = frameRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize({ width: rect.width, height: rect.height })
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('resize', updateFrameDimensions)
    return () => window.removeEventListener('resize', updateFrameDimensions)
  }, [isOpen, updateFrameDimensions])

  // Clamp pan so image never leaves the frame
  const clampPan = useCallback((x: number, y: number, currentScale: number, currentFrameW: number, currentFrameH: number) => {
    if (!naturalSize) return { x: 0, y: 0 }
    const renderedW = naturalSize.width * currentScale
    const renderedH = naturalSize.height * currentScale
    const maxPanX = Math.max(0, (renderedW - currentFrameW) / 2)
    const maxPanY = Math.max(0, (renderedH - currentFrameH) / 2)
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, y)),
    }
  }, [naturalSize])

  // When image loads, compute initial minScale so image covers the frame
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    setNaturalSize({ width: nw, height: nh })

    // Measure frame
    let fw = 320
    let fh = 128
    if (frameRef.current) {
      const rect = frameRef.current.getBoundingClientRect()
      if (rect.width > 0) {
        fw = rect.width
        fh = rect.height
        setFrameSize({ width: fw, height: fh })
      }
    }

    // minScale ensures image ALWAYS fills frame width & height without black gaps
    const calculatedMinScale = Math.max(fw / nw, fh / nh)
    const calculatedMaxScale = calculatedMinScale * 4
    setMinScale(calculatedMinScale)
    setMaxScale(calculatedMaxScale)
    setScale(calculatedMinScale)
    setPan({ x: 0, y: 0 })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    onHaptic?.()
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageSrc(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Mouse wheel zoom (PC / Laptop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    const nextScale = Math.max(minScale, Math.min(maxScale, scale * zoomFactor))
    setScale(nextScale)
    setPan((prev) => clampPan(prev.x, prev.y, nextScale, frameSize.width, frameSize.height))
  }

  // Pointer / Touch Handlers for Drag and Pinch-to-zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imageSrc || !naturalSize) return
    isDraggingRef.current = true
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch (_) {}
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || pinchStartRef.current) return
    const deltaX = e.clientX - dragStartRef.current.clientX
    const deltaY = e.clientY - dragStartRef.current.clientY
    const targetX = dragStartRef.current.panX + deltaX
    const targetY = dragStartRef.current.panY + deltaY
    const clamped = clampPan(targetX, targetY, scale, frameSize.width, frameSize.height)
    setPan(clamped)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  // Multi-touch Pinch to Zoom on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
      pinchStartRef.current = { dist, scale }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
      const ratio = dist / pinchStartRef.current.dist
      const nextScale = Math.max(minScale, Math.min(maxScale, pinchStartRef.current.scale * ratio))
      setScale(nextScale)
      setPan((prev) => clampPan(prev.x, prev.y, nextScale, frameSize.width, frameSize.height))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartRef.current = null
    }
  }

  // Zoom Slider Handlers
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextScale = parseFloat(e.target.value)
    setScale(nextScale)
    setPan((prev) => clampPan(prev.x, prev.y, nextScale, frameSize.width, frameSize.height))
  }

  // High-Resolution Retina Crop (1200 x 480 at 2.5 : 1 ratio)
  const handleSave = useCallback(async () => {
    if (!imgRef.current || !naturalSize || isSaving) return

    setIsSaving(true)
    onHaptic?.()

    try {
      const img = imgRef.current
      const nw = naturalSize.width
      const nh = naturalSize.height
      const fw = frameSize.width
      const fh = frameSize.height

      // Natural coordinate mapping
      const naturalCenterX = nw / 2 - pan.x / scale
      const naturalCenterY = nh / 2 - pan.y / scale
      const cw = fw / scale
      const ch = fh / scale

      const sx = Math.max(0, Math.min(nw - cw, naturalCenterX - cw / 2))
      const sy = Math.max(0, Math.min(nh - ch, naturalCenterY - ch / 2))
      const sw = Math.min(nw - sx, cw)
      const sh = Math.min(nh - sy, ch)

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
  }, [naturalSize, frameSize, pan, scale, isSaving, onHaptic, onSaveCover, onClose])

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
            <h2 className="text-base font-black text-white">
              Обложка вишлиста
            </h2>
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
          <div className="mt-4 space-y-3.5">
            {/* Viewport Box (Fixed in center, image moves behind fixed frame) */}
            <div
              ref={viewportRef}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-[280px] sm:h-[300px] rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            >
              {/* Scalable & Pannable Image */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Source preview"
                draggable={false}
                onLoad={handleImageLoaded}
                className="absolute max-w-none pointer-events-none transition-none"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
                  transformOrigin: 'center center',
                }}
              />

              {/* Fixed 2.5:1 Crop Frame with 9999px Dark Overlay Outside */}
              <div
                ref={frameRef}
                className="relative w-[90%] max-w-[360px] aspect-[2.5/1] rounded-2xl border-2 border-white pointer-events-none z-10 flex flex-col justify-between p-1.5 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)]"
              >
                {/* Subtle Rule-of-Thirds Grid */}
                <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none">
                  <div className="w-full border-t border-white/20" />
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                  <div className="h-full border-l border-white/20" />
                  <div className="h-full border-l border-white/20" />
                </div>

                {/* Corner Marks */}
                <div className="flex justify-between w-full relative z-10">
                  <div className="w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                  <div className="w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                </div>
                <div className="flex justify-between w-full relative z-10">
                  <div className="w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                  <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-white" />
                </div>
              </div>

              {/* Top-left Quick Change button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onHaptic?.()
                  fileInputRef.current?.click()
                }}
                className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/15 flex items-center gap-1 active:scale-95 cursor-pointer shadow-md z-20"
              >
                <RefreshCw size={10} />
                <span>Другое фото</span>
              </button>
            </div>

            {/* Intuitive Zoom Slider & Controls */}
            <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                <span className="flex items-center gap-1">
                  <span>Масштаб</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    (зум 2 пальцами или колёсиком)
                  </span>
                </span>
                <span className="text-white font-mono">
                  {Math.round((scale / minScale) * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onHaptic?.()
                    const nextScale = Math.max(minScale, scale * 0.88)
                    setScale(nextScale)
                    setPan((prev) => clampPan(prev.x, prev.y, nextScale, frameSize.width, frameSize.height))
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Уменьшить"
                >
                  <ZoomOut size={16} />
                </button>

                <input
                  type="range"
                  min={minScale}
                  max={maxScale}
                  step={(maxScale - minScale) / 100}
                  value={scale}
                  onChange={handleSliderChange}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />

                <button
                  type="button"
                  onClick={() => {
                    onHaptic?.()
                    const nextScale = Math.min(maxScale, scale * 1.14)
                    setScale(nextScale)
                    setPan((prev) => clampPan(prev.x, prev.y, nextScale, frameSize.width, frameSize.height))
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Увеличить"
                >
                  <ZoomIn size={16} />
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
