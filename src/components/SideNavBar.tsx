// Server Component — no 'use client' needed

const CATEGORIES = [
  { icon: 'verified',       label: 'Only in SM Markets' },
  { icon: 'nutrition',      label: 'Fresh Produce' },
  { icon: 'restaurant',     label: 'Fresh Meat & Seafood' },
  { icon: 'icecream',       label: 'Frozen Goods' },
  { icon: 'microwave',      label: 'Ready To Heat & Eat Items' },
  { icon: 'cooking',        label: 'Ready To Cook' },
  { icon: 'egg_alt',        label: 'Chilled & Dairy Items' },
  { icon: 'bakery_dining',  label: 'Bakery' },
] as const;

export default function SideNavBar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] hidden md:flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)] w-64 overflow-y-auto custom-scrollbar z-40">
      {/* Promo banner */}
      <div className="p-4 border-b border-[var(--color-border-subtle)]">
        <img className="w-full h-auto rounded mb-4 object-cover" data-alt="A promotional banner for SM Price Drop featuring various grocery items like hotdogs, canned goods, and snacks on a bright pink and yellow background. Modern retail aesthetic, high contrast." src="https://smmarkets.ph/media/resized/1443x600/m/a/mailer_july_24_-_aug_6_.jpeg"/>
        <h3 className="text-lg font-bold text-[var(--color-primary)] mb-1">For you</h3>
        <p className="text-sm text-[var(--color-on-surface-variant)]">Browse our daily selections</p>
      </div>

      {/* Quick links */}
      <div className="py-2 border-b border-[var(--color-border-subtle)]">
        {[
          { icon: 'menu_book', label: 'Recipe' },
          { icon: 'article',   label: 'Blog' },
        ].map(({ icon, label }) => (
          <a
            key={label}
            href="#"
            className="flex items-center gap-3 py-3 px-4 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)]">{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
          </a>
        ))}
      </div>

      {/* Categories */}
      <div className="py-4">
        <h4 className="px-4 text-base font-bold text-[var(--color-primary)] mb-2">Categories</h4>
        <nav aria-label="Product categories">
          {CATEGORIES.map(({ icon, label }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 py-3 px-4 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all group"
            >
              <span className="material-symbols-outlined text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                {icon}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
