import React from 'react'

interface LiquidRadarLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  title?: string
  subtitle?: string
  variant?: 1 | 2 | 3 | 4
}

export const LiquidRadarLoader: React.FC<LiquidRadarLoaderProps> = ({
  size = 'md',
  title = 'Поиск товара по ссылке',
  subtitle = 'Это может занять немного времени',
  variant = 1,
}) => {
  const isSm = size === 'sm'

  // Variant palette configuration
  const config = {
    1: {
      outerStroke: 'url(#rose-orbit-grad)',
      middleStroke: '#ffffff',
      innerStroke: 'url(#rose-orbit-grad)',
      sphereBg: 'radial-gradient(circle at 35% 35%, rgba(255, 117, 140, 0.85), rgba(196, 69, 123, 0.95) 60%, #4a132c)',
      sphereShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 0 20px rgba(196, 69, 123, 0.5)',
      blob1: '#ffbf48',
      blob2: '#ff758c',
      blob3: '#ffffff',
      shimmerGrad: 'from-transparent via-[#ff758c] to-transparent',
      glyph: '🎁',
    },
    2: {
      outerStroke: 'rgba(255, 255, 255, 0.8)',
      middleStroke: '#f59e0b',
      innerStroke: 'rgba(255, 255, 255, 0.5)',
      sphereBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.05) 100%)',
      sphereShadow: 'inset 0 4px 8px rgba(255, 255, 255, 0.7), inset 0 -6px 12px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)',
      blob1: '#f59e0b',
      blob2: '#ff758c',
      blob3: '#ffffff',
      shimmerGrad: 'from-transparent via-[#f59e0b] to-transparent',
      glyph: '✨',
    },
    3: {
      outerStroke: '#818cf8',
      middleStroke: '#c4457b',
      innerStroke: '#ffffff',
      sphereBg: 'radial-gradient(circle, #312e81 0%, #0f172a 100%)',
      sphereShadow: '0 0 25px rgba(99, 102, 241, 0.6)',
      blob1: '#818cf8',
      blob2: '#c4457b',
      blob3: '#ffffff',
      shimmerGrad: 'from-transparent via-[#818cf8] to-transparent',
      glyph: '⚡',
    },
    4: {
      outerStroke: 'url(#rose-orbit-grad)',
      middleStroke: '#ffffff',
      innerStroke: 'url(#rose-orbit-grad)',
      sphereBg: 'radial-gradient(circle at 35% 35%, #ff758c, #c4457b 70%)',
      sphereShadow: '0 0 15px rgba(196, 69, 123, 0.5)',
      blob1: '#ffffff',
      blob2: '#ffbf48',
      blob3: '#ff758c',
      shimmerGrad: 'from-transparent via-[#ff758c] to-transparent',
      glyph: '🎁',
    },
  }[variant] || {
    outerStroke: 'url(#rose-orbit-grad)',
    middleStroke: '#ffffff',
    innerStroke: 'url(#rose-orbit-grad)',
    sphereBg: 'radial-gradient(circle at 35% 35%, rgba(255, 117, 140, 0.85), rgba(196, 69, 123, 0.95) 60%, #4a132c)',
    sphereShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 0 20px rgba(196, 69, 123, 0.5)',
    blob1: '#ffbf48',
    blob2: '#ff758c',
    blob3: '#ffffff',
    shimmerGrad: 'from-transparent via-[#ff758c] to-transparent',
    glyph: '🎁',
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 px-3 w-full animate-fadeIn select-none">
      {/* SVG Gooey Filter Definitions for Lava Blobs */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="liquid-goo-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <linearGradient id="rose-orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff758c" />
            <stop offset="100%" stopColor="#c4457b" />
          </linearGradient>
        </defs>
      </svg>

      {/* Orbit + Liquid Sphere Container */}
      <div className={`relative flex items-center justify-center ${isSm ? 'w-24 h-24' : 'w-32 h-32'}`}>
        {/* Pink Deer Concentric Wi-Fi / Radar Circles */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Outer Ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2.5"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={config.outerStroke}
            strokeWidth="3"
            strokeLinecap="round"
            className="origin-center animate-[circle-outer_2.2s_cubic-bezier(0.4,0,0.2,1)_infinite]"
            style={{
              strokeDasharray: '70 210',
              strokeDashoffset: 70,
            }}
          />

          {/* Middle Ring */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke={config.middleStroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="origin-center animate-[circle-middle_2.2s_cubic-bezier(0.4,0,0.2,1)_infinite]"
            style={{
              strokeDasharray: '55 165',
              strokeDashoffset: 55,
            }}
          />

          {/* Inner Ring (hidden on variant 4 for minimal look) */}
          {variant !== 4 && (
            <>
              <circle
                cx="50"
                cy="50"
                r="26"
                fill="none"
                stroke="rgba(196, 69, 123, 0.2)"
                strokeWidth="1.5"
              />
              <circle
                cx="50"
                cy="50"
                r="26"
                fill="none"
                stroke={config.innerStroke}
                strokeWidth="2"
                strokeLinecap="round"
                className="origin-center animate-[circle-inner_2.2s_cubic-bezier(0.4,0,0.2,1)_infinite]"
                style={{
                  strokeDasharray: '40 120',
                  strokeDashoffset: 40,
                }}
              />
            </>
          )}
        </svg>

        {/* Inner Young-Walrus Liquid Lava Sphere */}
        <div
          className={`relative rounded-full overflow-hidden flex items-center justify-center border border-white/30 backdrop-blur-md shadow-lg ${
            isSm ? 'w-11 h-11' : 'w-14 h-14'
          }`}
          style={{
            background: config.sphereBg,
            boxShadow: config.sphereShadow,
          }}
        >
          {/* Lava Blobs */}
          <div
            className="absolute inset-0 w-full h-full opacity-80 pointer-events-none"
            style={{ filter: 'url(#liquid-goo-filter)' }}
          >
            <div
              className="absolute w-6 h-6 rounded-full top-1 left-1 animate-[float-blob-1_3s_ease-in-out_infinite]"
              style={{ backgroundColor: config.blob1 }}
            />
            <div
              className="absolute w-7 h-7 rounded-full bottom-1 right-1 animate-[float-blob-2_3.6s_ease-in-out_infinite]"
              style={{ backgroundColor: config.blob2 }}
            />
            <div
              className="absolute w-5 h-5 rounded-full top-2 right-1 animate-[float-blob-3_2.8s_ease-in-out_infinite]"
              style={{ backgroundColor: config.blob3 }}
            />
          </div>

          <span className="relative z-10 text-xs font-black text-white drop-shadow-md">
            {config.glyph}
          </span>
        </div>
      </div>

      {/* Dynamic Text Information */}
      <div className="mt-3 text-center space-y-1">
        <div className="text-xs font-bold text-white tracking-wide flex items-center justify-center gap-1">
          <span>{title}</span>
          <span className="inline-flex">
            <span className="animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] text-[#ff758c]">.</span>
            <span className="animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_0.2s_infinite] text-[#ff758c]">.</span>
            <span className="animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_0.4s_infinite] text-[#ff758c]">.</span>
          </span>
        </div>

        {subtitle && (
          <div className="text-[11px] text-zinc-400 font-medium">
            {subtitle}
          </div>
        )}

        {/* Shimmer Progress Line */}
        <div className="w-36 h-1 bg-white/10 rounded-full mx-auto mt-2 overflow-hidden relative">
          <div
            className={`absolute inset-0 bg-gradient-to-r ${config.shimmerGrad} -translate-x-full animate-[shimmer_1.8s_infinite]`}
          />
        </div>
      </div>
    </div>
  )
}
