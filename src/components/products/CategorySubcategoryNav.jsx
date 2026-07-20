import ProductCard from '../ProductCard'
import { getCategoryPath } from '../../lib/categoryUrls'

export default function CategorySubcategoryNav({
  parentCategory,
  subcategories,
  activeSubcategory,
  onSelectAll,
  onSelectSubcategory,
}) {
  if (!parentCategory || subcategories.length === 0) return null

  return (
    <div className="mb-6">
      <p className="text-sm font-black text-slate-700 mb-3">
        أقسام داخل {parentCategory.name}
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={onSelectAll}
          className={`flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-black text-sm transition ${
            activeSubcategory === 'all'
              ? 'bg-[#0B1F3A] text-white shadow-sm'
              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
        >
          الكل
        </button>

        {subcategories.map((subcategory) => (
          <button
            key={subcategory.id}
            type="button"
            onClick={() => onSelectSubcategory(subcategory.id)}
            className={`flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-black text-sm transition whitespace-nowrap ${
              activeSubcategory === subcategory.id
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {subcategory.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CategoryGroupedProducts({
  parentCategory,
  subcategories,
  products,
  addedProductId,
  onAddToCart,
  onViewSubcategory,
  parentOnlyProducts = [],
}) {
  const sections = subcategories
    .map((subcategory) => ({
      subcategory,
      products: products.filter(
        (product) => product.category_id === subcategory.id
      ),
    }))
    .filter((section) => section.products.length > 0)

  const hasParentProducts = parentOnlyProducts.length > 0

  if (sections.length === 0 && !hasParentProducts) {
    return null
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {sections.map(({ subcategory, products: sectionProducts }) => (
        <section
          key={subcategory.id}
          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500">
                {parentCategory.name}
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                {subcategory.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onViewSubcategory(subcategory.id)}
              className="self-start sm:self-auto text-sky-700 font-black text-sm hover:underline"
            >
              عرض كل منتجات {subcategory.name}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {sectionProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                added={addedProductId === product.id}
                onAddToCart={onAddToCart}
                variant="category"
              />
            ))}
          </div>
        </section>
      ))}

      {hasParentProducts && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 mb-4">
            منتجات عامة — {parentCategory.name}
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {parentOnlyProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                added={addedProductId === product.id}
                onAddToCart={onAddToCart}
                variant="category"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function getSubcategoryViewPath(parentCategory, subcategory) {
  return getCategoryPath(parentCategory, subcategory)
}
