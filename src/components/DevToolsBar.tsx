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
    <div className="w-full bg-[#161618] border-b border-white/10 py-1.5 px-4 flex items-center justify-between text-xs sticky top-0 z-50 select-none">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-white/5">
          DEV
        </span>
        <button
          onClick={onToggleOwner}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
            isOwner
              ? 'bg-white text-black shadow-sm'
              : 'bg-[#27272a] text-zinc-300 border border-white/10'
          }`}
        >
          {isOwner ? <UserCheck size={13} /> : <Users size={13} />}
          <span>{isOwner ? 'Владелец' : 'Гость (Друг)'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onResetData}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#27272a] text-zinc-400 hover:text-white active:scale-95 border border-white/5 transition-colors"
          title="Сбросить тестовые данные"
        >
          <RotateCcw size={12} />
          <span>Сброс</span>
        </button>
      </div>
    </div>
  )
}
