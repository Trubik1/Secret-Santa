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

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-40 select-none pointer-events-auto">
      {/* Liquid Glass Floating Dock with Apple HIG backdrop blur & frosted glow */}
      <div className="liquid-glass-dock liquid-glass-dock-dark relative rounded-full p-1.5 flex items-center justify-between">
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
              className={`relative z-10 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer rounded-full ${
                isActive
                  ? 'glass-active-tab glass-active-tab-dark px-5 py-2.5'
                  : 'text-zinc-400 hover:text-zinc-200 px-3 py-2.5'
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
