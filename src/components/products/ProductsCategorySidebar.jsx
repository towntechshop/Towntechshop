import { useMemo, useState } from 'react'

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between py-3 text-right font-black text-slate-800"
      >
        <span>{title}</span>
        <span className="text-slate-400 text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

export default function ProductsCategorySidebar({
  parentCategories,
  subcategoriesByParent,
  productCountByCategory,
  activeCategory,
  activeSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  inStockOnly,
  onInStockOnlyChange,
  brands,
  selectedBrand,
  onBrandChange,
  priceRange,
  onPriceRangeChange,
}) {
  const activeParent = parentCategories.find((item) => item.id === activeCategory)

  const sidebarParents = activeCategory !== 'all' && activeParent
    ? [activeParent]
    : parentCategories

  const getParentTotal = (parentId) => {
    const childIds = (subcategoriesByParent[parentId] || []).map((item) => item.id)
    const direct = productCountByCategory[parentId] || 0
    const children = childIds.reduce(
      (sum, id) => sum + (productCountByCategory[id] || 0),
      0
    )
    return direct + children
  }

  return (
    <aside className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 h-fit lg:sticky lg:top-24">
      <FilterSection title="الفئة">
        <div className="space-y-1 text-sm">
          <button
            type="button"
            onClick={() => onCategorySelect('all')}
            className={`w-full flex items-center justify-between rounded-lg px-2 py-2 font-black transition ${
              activeCategory === 'all'
                ? 'bg-sky-50 text-sky-800'
                : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>جميع المنتجات</span>
            <span className="text-slate-400 font-bold">
              ({Object.values(productCountByCategory).reduce(
                (sum, count) => sum + count,
                0
              )})
            </span>
          </button>

          {sidebarParents.map((parent) => {
            const subcategories = subcategoriesByParent[parent.id] || []
            const isActiveParent = activeCategory === parent.id

            return (
              <div key={parent.id}>
                <button
                  type="button"
                  onClick={() => onCategorySelect(parent.id)}
                  className={`w-full flex items-center justify-between rounded-lg px-2 py-2 font-black transition ${
                    isActiveParent && activeSubcategory === 'all'
                      ? 'bg-sky-50 text-sky-800'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{parent.name}</span>
                  <span className="text-slate-400 font-bold">
                    ({getParentTotal(parent.id)})
                  </span>
                </button>

                {isActiveParent && subcategories.length > 0 && (
                  <div className="mr-3 mt-1 space-y-0.5 border-r-2 border-slate-100 pr-2">
                    {subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => onSubcategorySelect(subcategory.id)}
                        className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 font-bold transition ${
                          activeSubcategory === subcategory.id
                            ? 'bg-[#0B1F3A] text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{subcategory.name}</span>
                        <span
                          className={
                            activeSubcategory === subcategory.id
                              ? 'text-white/80'
                              : 'text-slate-400'
                          }
                        >
                          ({productCountByCategory[subcategory.id] || 0})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title="اعرض فقط">
        <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => onInStockOnlyChange(event.target.checked)}
            className="w-4 h-4"
          />
          <span>متوفر</span>
        </label>
      </FilterSection>

      {brands.length > 0 && (
        <FilterSection title="العلامة التجارية" defaultOpen={false}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="brand-filter"
                checked={!selectedBrand}
                onChange={() => onBrandChange('')}
                className="w-4 h-4"
              />
              <span>الكل</span>
            </label>
            {brands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="brand-filter"
                  checked={selectedBrand === brand}
                  onChange={() => onBrandChange(brand)}
                  className="w-4 h-4"
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="السعر" defaultOpen={false}>
        <select
          value={priceRange}
          onChange={(event) => onPriceRangeChange(event.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 bg-white outline-none focus:border-sky-400"
        >
          <option value="all">كل الأسعار</option>
          <option value="0-500">أقل من 500 جنيه</option>
          <option value="500-1000">500 - 1,000 جنيه</option>
          <option value="1000-3000">1,000 - 3,000 جنيه</option>
          <option value="3000+">أكثر من 3,000 جنيه</option>
        </select>
      </FilterSection>
    </aside>
  )
}

export function useProductCountByCategory(products) {
  return useMemo(() => {
    const map = {}

    products.forEach((product) => {
      if (!product.category_id) return
      map[product.category_id] = (map[product.category_id] || 0) + 1
    })

    return map
  }, [products])
}
