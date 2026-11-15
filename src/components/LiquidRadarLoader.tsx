import React from 'react'

interface WifiLoaderProps {
  text?: string
  subtext?: string
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LiquidRadarLoader: React.FC<WifiLoaderProps> = ({
  text,
  subtext,
  title,
  subtitle,
  size = 'md',
}) => {
  const displayTitle = text || title || 'поиск товара'
  const displaySubtext = subtext || subtitle || 'Это может занять немного времени'
  const scale = size === 'sm' ? 'scale-90' : size === 'lg' ? 'scale-110' : 'scale-100'

  return (
    <div className="flex flex-col items-center justify-center py-6 px-3 w-full select-none animate-fadeIn">
      {/* Exact Pink-Deer-76 Component from Uiverse.io in Dark Theme */}
      <div id="wifi-loader" className={`my-2 ${scale} transition-transform`}>
        <svg className="circle-outer" viewBox="0 0 86 86">
          <circle className="back" cx="43" cy="43" r="40" />
          <circle className="front" cx="43" cy="43" r="40" />
          <circle className="new" cx="43" cy="43" r="40" />
        </svg>
        <svg className="circle-middle" viewBox="0 0 60 60">
          <circle className="back" cx="30" cy="30" r="27" />
          <circle className="front" cx="30" cy="30" r="27" />
        </svg>
        <svg className="circle-inner" viewBox="0 0 34 34">
          <circle className="back" cx="17" cy="17" r="14" />
          <circle className="front" cx="17" cy="17" r="14" />
        </svg>
        <div className="text" data-text={displayTitle} />
      </div>

      {/* Subtitle requested by user */}
      {displaySubtext && (
        <div className="mt-11 text-[11px] text-zinc-400 font-medium tracking-wide text-center">
          {displaySubtext}
        </div>
      )}
    </div>
  )
}
