import React from 'react'
import { Gift, Users, Sparkles, Settings } from 'lucide-react'

export type NavTabType = 'my' | 'friends' | 'santa' | 'settings'

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
    { id: 'my', label: 'Вишлист', icon: <Gift size={18} strokeWidth={2.2} /> },
    { id: 'friends', label: 'Друзья', icon: <Users size={18} strokeWidth={2.2} /> },
    { id: 'santa', label: 'Санта', icon: <Sparkles size={18} strokeWidth={2.2} /> },
    { id: 'settings', label: 'Опции', icon: <Settings size={18} strokeWidth={2.2} /> },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-40 select-none">
      <div className="liquid-glass-dock rounded-full p-1.5 flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                onHaptic?.()
                onChangeTab(tab.id)
              }}
              className={`flex-1 py-2 px-1.5 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-200 active-press ${
                isActive
                  ? 'glass-active-tab font-black shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold'
              }`}
            >
              <div className="transition-transform duration-200 scale-100">{tab.icon}</div>
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
