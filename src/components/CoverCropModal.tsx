import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'

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
  const [displayedSize, setDisplayedSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [framePos, setFramePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; frameX: number; frameY: number }>({
    pointerX: 0,
    pointerY: 0,
    frameX: 0,
    frameY: 0,
  })
  const imgRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setIsSaving(false)
      setIsDragging(false)
    }
  }, [isOpen])

  // Measure displayed image on mount / resize / image change
  const updateDisplayedSize = useCallback(() => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setDisplayedSize({ width: rect.width, height: rect.height })
      }
    }
  }, [])

  useEffect(() => {
    if (!imageSrc || !isOpen) return
    window.addEventListener('resize', updateDisplayedSize)
    return () => window.removeEventListener('resize', updateDisplayedSize)
  }, [imageSrc, isOpen, updateDisplayedSize])

  // Calculate crop frame dimensions (exact 2.5 : 1 banner ratio)
  const targetAspect = 2.5
  const photoAspect =
    displayedSize.width > 0 && displayedSize.height > 0
      ? displayedSize.width / displayedSize.height
      : targetAspect

  let frameW = displayedSize.width
  let frameH = displayedSize.height

  if (photoAspect <= targetAspect) {
    // Photo is taller than 2.5:1 -> frame takes full photo width
    frameW = displayedSize.width
    frameH = displayedSize.width / targetAspect
  } else {
    // Photo is wider than 2.5:1 -> frame takes full photo height
    frameH = displayedSize.height
    frameW = displayedSize.height * targetAspect
  }

  const maxFrameX = Math.max(0, displayedSize.width - frameW)
  const maxFrameY = Math.max(0, displayedSize.height - frameH)

  // Initialize frame in center once image dimensions are known
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    setNaturalSize({ width: nw, height: nh })

    const dw = img.clientWidth
    const dh = img.clientHeight
    setDisplayedSize({ width: dw, height: dh })

    const aspect = dw / dh
    let fw = dw
    let fh = dh
    if (aspect <= targetAspect) {
      fw = dw
      fh = dw / targetAspect
    } else {
      fh = dh
      fw = dh * targetAspect
    }

    const initX = Math.max(0, (dw - fw) / 2)
    const initY = Math.max(0, (dh - fh) / 2)
    setFramePos({ x: initX, y: initY })
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

  // Pointer drag to move frame over photo
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imageSrc || displayedSize.width === 0) return
    setIsDragging(true)
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      frameX: framePos.x,
      frameY: framePos.y,
    }
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch (_) {}
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStartRef.current.pointerX
    const deltaY = e.clientY - dragStartRef.current.pointerY

    const nextX = Math.min(maxFrameX, Math.max(0, dragStartRef.current.frameX + deltaX))
    const nextY = Math.min(maxFrameY, Math.max(0, dragStartRef.current.frameY + deltaY))

    setFramePos({ x: nextX, y: nextY })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  // High-Resolution Retina Crop (1200 x 480 at quality 0.92)
  const handleSave = useCallback(async () => {
    if (!imgRef.current || !naturalSize || displayedSize.width === 0 || isSaving) return

    setIsSaving(true)
    onHaptic?.()

    try {
      const img = imgRef.current
      const Wn = naturalSize.width
      const Hn = naturalSize.height
      const Wd = displayedSize.width

      // Scale factor from displayed photo pixels to natural image pixels
      const S = Wn / Wd

      // Natural crop coordinates
      const sx = Math.max(0, Math.min(Wn - 1, framePos.x * S))
      const sy = Math.max(0, Math.min(Hn - 1, framePos.y * S))
      const sw = Math.min(Wn - sx, frameW * S)
      const sh = Math.min(Hn - sy, frameH * S)

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
  }, [naturalSize, displayedSize, framePos, frameW, frameH, isSaving, onHaptic, onSaveCover, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Clean, no "Giftly Premium" text!) */}
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
          <div className="mt-4 space-y-4">
            {/* Full Photo Box with Highlighted Crop Viewfinder */}
            <div className="relative flex flex-col items-center">
              <div
                ref={wrapperRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative overflow-hidden rounded-2xl bg-[#0d0d0f] border border-white/10 flex items-center justify-center max-h-[380px] w-full cursor-grab active:cursor-grabbing touch-none select-none"
              >
                {/* Full, uncropped image completely visible */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={handleImageLoaded}
                  className="max-w-full max-h-[360px] object-contain block pointer-events-none select-none"
                />

                {displayedSize.width > 0 && (
                  <>
                    {/* Darkened overlay outside the frame (TOP) */}
                    <div
                      style={{ top: 0, left: 0, right: 0, height: `${framePos.y}px` }}
                      className="absolute bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-none"
                    />

                    {/* Darkened overlay outside the frame (BOTTOM) */}
                    <div
                      style={{
                        top: `${framePos.y + frameH}px`,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                      className="absolute bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-none"
                    />

                    {/* Darkened overlay outside the frame (LEFT) */}
                    {maxFrameX > 0 && (
                      <div
                        style={{
                          top: `${framePos.y}px`,
                          left: 0,
                          width: `${framePos.x}px`,
                          height: `${frameH}px`,
                        }}
                        className="absolute bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-none"
                      />
                    )}

                    {/* Darkened overlay outside the frame (RIGHT) */}
                    {maxFrameX > 0 && (
                      <div
                        style={{
                          top: `${framePos.y}px`,
                          left: `${framePos.x + frameW}px`,
                          right: 0,
                          height: `${frameH}px`,
                        }}
                        className="absolute bg-black/65 backdrop-blur-[0.5px] pointer-events-none transition-none"
                      />
                    )}

                    {/* Clear, bright 2.5:1 Crop Frame */}
                    <div
                      style={{
                        left: `${framePos.x}px`,
                        top: `${framePos.y}px`,
                        width: `${frameW}px`,
                        height: `${frameH}px`,
                      }}
                      className="absolute border-2 border-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.6)] pointer-events-none flex flex-col justify-between p-1.5 transition-none"
                    >
                      {/* Subtle Viewfinder Rule-of-Thirds Grid */}
                      <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none">
                        <div className="w-full border-t border-white/20" />
                        <div className="w-full border-t border-white/20" />
                      </div>
                      <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                        <div className="h-full border-l border-white/20" />
                        <div className="h-full border-l border-white/20" />
                      </div>

                      {/* Corner Viewfinder Marks */}
                      <div className="flex justify-between w-full relative z-10">
                        <div className="w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                        <div className="w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                      </div>
                      <div className="flex justify-between w-full relative z-10">
                        <div className="w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                        <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-white" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Change Button */}
              <button
                type="button"
                onClick={() => {
                  onHaptic?.()
                  fileInputRef.current?.click()
                }}
                className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/10 flex items-center gap-1 active:scale-95 cursor-pointer shadow-md z-20"
              >
                <RefreshCw size={10} />
                <span>Другое фото</span>
              </button>
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
