import React from 'react'
import { CategoryId } from '../types'
import { Sparkles, Smartphone, Shirt, Home, BookOpen, Gift } from 'lucide-react'

interface CategoryFilterProps {
  selectedCategory: CategoryId
  onSelectCategory: (id: CategoryId) => void
}

const CATEGORIES: { id: CategoryId; title: string; icon: React.ReactNode }[] = [
  { id: 'all', title: 'Все', icon: <Sparkles size={15} /> },
  { id: 'gadgets', title: 'Гаджеты', icon: <Smartphone size={15} /> },
  { id: 'clothes', title: 'Одежда', icon: <Shirt size={15} /> },
  { id: 'home', title: 'Для дома', icon: <Home size={15} /> },
  { id: 'books', title: 'Книги', icon: <BookOpen size={15} /> },
  { id: 'other', title: 'Другое', icon: <Gift size={15} /> },
]

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar px-4 py-2 flex items-center gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active-press shrink-0 ${
              isActive
                ? 'bg-accent-rose text-white shadow-md shadow-accent-rose/25 scale-[1.02]'
                : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted dark:text-ink-muted-dark hover:text-ink-light dark:hover:text-ink-dark'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.title}</span>
          </button>
        )
      })}
    </div>
  )
}
