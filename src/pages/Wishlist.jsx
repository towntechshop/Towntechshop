import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import useSavedList from '../hooks/useSavedList'
import { addToCart } from '../lib/cart'
import { clearList } from '../lib/savedLists'
import usePageSeo from '../hooks/usePageSeo'

export default function Wishlist() {
  const items = useSavedList('wishlist')
  const [addedId, setAddedId] = useState(null)

  usePageSeo({ title: 'المفضلة', description: 'المنتجات اللي حفظتها في المفضلة.' })

  const handleAdd = (product) => {
    addToCart(product, 1)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1200)
  }

  return (
    <div className="min-h-[60vh] bg-[#F4F7FB] px-4 py-8" dir="rtl">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0B1F3A]">المفضلة</h1>
            <p className="text-slate-500 mt-1">{items.length} منتج محفوظ على الجهاز ده</p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => clearList('wishlist')}
              className="text-sm font-bold text-red-600 hover:underline"
            >
              مسح المفضلة
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-lg font-bold text-[#0B1F3A]">المفضلة فاضية</p>
            <p className="text-slate-500 mt-2">اضغط على القلب في أي منتج عشان تحفظه هنا وترجعله بعدين.</p>
            <Link to="/products" className="inline-flex mt-5 bg-[#0B1F3A] text-white px-6 py-3 rounded-xl font-bold">
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} added={addedId === product.id} onAddToCart={handleAdd} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
