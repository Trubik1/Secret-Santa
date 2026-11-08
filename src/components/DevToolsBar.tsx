import React from 'react'
import { UserCheck, Users, RotateCcw, Moon, Sun } from 'lucide-react'

interface DevToolsBarProps {
  isOwner: boolean
  colorScheme: 'light' | 'dark'
  onToggleOwner: () => void
  onResetData: () => void
  onToggleTheme: () => void
}

export const DevToolsBar: React.FC<DevToolsBarProps> = ({
  isOwner,
  colorScheme,
  onToggleOwner,
  onResetData,
  onToggleTheme,
}) => {
  return (
    <div className="w-full bg-surface-soft dark:bg-surface-soft-dark border-b border-border-soft dark:border-border-soft-dark py-2 px-4 flex items-center justify-between text-xs sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-accent-rose text-white text-[10px] font-extrabold uppercase tracking-wider">
          Dev Bar
        </span>
        <span className="font-semibold text-ink-muted hidden sm:inline">
          Режим просмотра:
        </span>
        <button
          onClick={onToggleOwner}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all active-press ${
            isOwner
              ? 'bg-accent-rose text-white shadow-sm'
              : 'bg-surface-card dark:bg-surface-card-dark text-ink-light dark:text-ink-dark border border-border-soft dark:border-border-soft-dark'
          }`}
        >
          {isOwner ? <UserCheck size={13} /> : <Users size={13} />}
          <span>{isOwner ? 'Владелец (Сюрприз-режим)' : 'Гость (Даритель)'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-full bg-surface-card dark:bg-surface-card-dark text-ink-muted hover:text-accent-rose active-press border border-border-soft dark:border-border-soft-dark"
          title="Сменить тему"
        >
          {colorScheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          onClick={onResetData}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-card dark:bg-surface-card-dark text-ink-muted hover:text-rose-500 active-press border border-border-soft dark:border-border-soft-dark"
          title="Сбросить тестовые данные"
        >
          <RotateCcw size={12} />
          <span className="hidden sm:inline">Сброс</span>
        </button>
      </div>
    </div>
  )
}
