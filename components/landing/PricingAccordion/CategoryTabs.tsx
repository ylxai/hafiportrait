'use client'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  display_order: number
}

interface CategoryTabsProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (slug: string) => void
}

export default function CategoryTabs({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-10 bg-detra-black/95 backdrop-blur-sm py-3 mb-6 -mx-4 px-4 shadow-sm">
      <div className="flex flex-wrap gap-1.5 justify-center max-w-4xl mx-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.slug)}
            className={`
              px-3 py-1.5 rounded-full font-medium transition-all duration-200
              text-xs md:text-sm
              ${
                selectedCategory === category.slug
                  ? 'bg-brand-teal text-white shadow-md scale-105'
                  : 'bg-detra-gray text-detra-light hover:bg-detra-gray/80'
              }
            `}
          >
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
