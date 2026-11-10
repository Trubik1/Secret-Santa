import React from 'react'
import { Sparkles, Gift, Users, Settings } from 'lucide-react'

export type NavTabType = 'santa' | 'my' | 'friends' | 'settings'

interface BottomNavDockProps {
  activeTab: NavTabType
  onChangeTab: (tab: NavTabType) => void
  onHaptic?: () => void
}

export const BottomNavDock: React.FC<BottomNavDockProps> = ({
  activeTab,
  onChangeTab,
  onHaptic,
}) => {
  // Order requested by user: Санта -> Я -> Друзья -> Настройки
  const tabs: { id: NavTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'santa', label: 'Санта', icon: <Sparkles size={18} strokeWidth={2.2} /> },
    { id: 'my', label: 'Я', icon: <Gift size={18} strokeWidth={2.2} /> },
    { id: 'friends', label: 'Друзья', icon: <Users size={18} strokeWidth={2.2} /> },
    { id: 'settings', label: 'Настройки', icon: <Settings size={18} strokeWidth={2.2} /> },
  ]

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab))

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-40 select-none">
      <div className="relative liquid-glass-dock rounded-full p-1 flex items-center justify-between">
        {/* Smooth Sliding Pill Indicator (Liquid Glass Glide) */}
        <div
          className="absolute top-1 bottom-1 rounded-full glass-active-tab transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] pointer-events-none"
          style={{
            width: 'calc((100% - 8px) / 4)',
            left: '4px',
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                onHaptic?.()
                onChangeTab(tab.id)
              }}
              className={`relative z-10 flex-1 py-2 px-1 rounded-full flex flex-col items-center justify-center gap-1 transition-colors duration-200 active-press ${
                isActive
                  ? 'text-[#d98aab] font-black'
                  : 'text-zinc-400 hover:text-white font-bold'
              }`}
            >
              <div className="transition-transform duration-200">{tab.icon}</div>
              <span className="text-[10px] tracking-tight truncate max-w-[70px] leading-none">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
