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
  const tabs: { id: NavTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'santa', label: 'Санта', icon: <Sparkles size={20} strokeWidth={2} /> },
    { id: 'my', label: 'Вишлист', icon: <Gift size={20} strokeWidth={2} /> },
    { id: 'friends', label: 'Друзья', icon: <Users size={20} strokeWidth={2} /> },
    { id: 'settings', label: 'Настройки', icon: <Settings size={20} strokeWidth={2} /> },
  ]

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab))

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-40 select-none pointer-events-auto">
      {/* Liquid Glass Floating Dock with Apple HIG backdrop blur & frosted glow */}
      <div className="liquid-glass-dock liquid-glass-dock-dark relative rounded-full p-1.5 flex items-center justify-between">
        {/* Floating Sliding Capsule Indicator (glides smoothly across tabs) */}
        <div
          className="absolute top-1.5 bottom-1.5 left-1.5 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            width: 'calc((100% - 12px) / 4)',
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        >
          <div className="w-full h-full rounded-full glass-active-tab glass-active-tab-dark" />
        </div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                onHaptic?.()
                onChangeTab(tab.id)
              }}
              title={tab.label}
              className={`relative z-10 flex-1 flex items-center justify-center py-2.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
                isActive
                  ? 'text-white scale-105'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-center">
                {tab.icon}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
