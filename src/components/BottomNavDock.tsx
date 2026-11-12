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
  // Ultra-crisp vector SVG icons with Apple HIG quality
  const tabs: { id: NavTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'santa', label: 'Санта', icon: <Sparkles size={20} strokeWidth={2} /> },
    { id: 'my', label: 'Вишлист', icon: <Gift size={20} strokeWidth={2} /> },
    { id: 'friends', label: 'Друзья', icon: <Users size={20} strokeWidth={2} /> },
    { id: 'settings', label: 'Настройки', icon: <Settings size={20} strokeWidth={2} /> },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-40 select-none">
      {/* Studio Minimalist Liquid Glass Pill Dock */}
      <div className="relative rounded-full bg-[#18181b]/95 backdrop-blur-2xl border border-white/10 p-1.5 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
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
              className={`relative z-10 flex items-center justify-center transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-[#27272a] text-white px-5 py-2.5 rounded-full shadow-inner ring-1 ring-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 px-3 py-2.5 rounded-full'
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
