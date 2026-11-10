import React from 'react'
import { UserCheck, Users, RotateCcw } from 'lucide-react'

interface DevToolsBarProps {
  isOwner: boolean
  onToggleOwner: () => void
  onResetData: () => void
}

export const DevToolsBar: React.FC<DevToolsBarProps> = ({
  isOwner,
  onToggleOwner,
  onResetData,
}) => {
  return (
    <div className="w-full bg-[#17171a] border-b border-[#34252f] py-2 px-4 flex items-center justify-between text-xs sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-[#c4457b] text-white text-[10px] font-extrabold uppercase tracking-wider">
          Dev Bar
        </span>
        <button
          onClick={onToggleOwner}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all active-press ${
            isOwner
              ? 'bg-[#c4457b] text-white shadow-sm'
              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
          }`}
        >
          {isOwner ? <UserCheck size={13} /> : <Users size={13} />}
          <span>{isOwner ? 'Владелец' : 'Гость (Друг)'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onResetData}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 hover:text-rose-400 active-press border border-zinc-700"
          title="Сбросить тестовые данные"
        >
          <RotateCcw size={12} />
          <span>Сброс</span>
        </button>
      </div>
    </div>
  )
}
