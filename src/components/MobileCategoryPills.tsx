'use client';

const CATEGORY_PILLS = [
  { id: 'freshMeatAndSeafood', label: 'Fresh Meat & Seafood', icon: 'set_meal' },
  { id: 'freshProduce',        label: 'Fruits & Vegetables',  icon: 'eco' },
  { id: 'pantry',              label: 'Pantry Staples',       icon: 'inventory_2' },
  { id: 'featuredProducts',    label: 'Featured',             icon: 'star' },
  { id: 'priceDrop',           label: 'Price Drop',           icon: 'sell' },
] as const;

export type CategoryId = typeof CATEGORY_PILLS[number]['id'];

interface MobileCategoryPillsProps {
  activeCategory: CategoryId;
  onCategoryChange: (id: CategoryId) => void;
}

export default function MobileCategoryPills({ activeCategory, onCategoryChange }: MobileCategoryPillsProps) {
  return (
    <section
      aria-label="Categories"
      className="w-full -mx-4 px-4 overflow-x-auto no-scrollbar pb-2"
    >
      <div className="flex gap-2 w-max">
        {CATEGORY_PILLS.map(({ id, label, icon }) => {
          const isActive = id === activeCategory;
          return (
            <button
              key={id}
              onClick={() => onCategoryChange(id)}
              className={[
                'px-4 py-2 rounded-full font-bold text-[12px] whitespace-nowrap flex items-center gap-2 shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
                isActive
                  ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] border border-[var(--color-primary)]'
                  : 'bg-white text-[var(--color-on-surface-variant)] border border-[var(--color-border-subtle)]',
              ].join(' ')}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : {}}
              >
                {icon}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
