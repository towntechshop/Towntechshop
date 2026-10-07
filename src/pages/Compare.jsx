import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useSavedList from '../hooks/useSavedList'
import usePageSeo from '../hooks/usePageSeo'
import { addToCart } from '../lib/cart'
import { clearList, removeFromList } from '../lib/savedLists'
import {
  formatPrice,
  getProductPrice,
  getRegularPrice,
  hasSale,
  isProductInStock,
} from '../lib/productUtils'

export default function Compare() {
  const saved = useSavedList('compare')
  const ids = useMemo(() => saved.map((item) => item.id), [saved])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState(null)

  usePageSeo({ title: 'مقارنة المنتجات', description: 'قارن بين المنتجات جنب بعض.' })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!ids.length) {
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*, categories(name)')
        .in('id', ids)
        .eq('is_visible', true)

      if (!cancelled) {
        const byId = Object.fromEntries((data || []).map((product) => [product.id, product]))
        setProducts(ids.map((id) => byId[id]).filter(Boolean))
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ids])

  const rows = [
    { label: 'السعر', render: (p) => <span className="font-bold text-[#0B1F3A]">{formatPrice(getProductPrice(p))} جنيه</span> },
    {
      label: 'السعر قبل الخصم',
      render: (p) => (hasSale(p) ? <span className="line-through text-slate-400">{formatPrice(getRegularPrice(p))} جنيه</span> : '—'),
    },
    {
      label: 'التوفر',
      render: (p) =>
        isProductInStock(p) ? <span className="text-green-700 font-bold">متوفر</span> : <span className="text-red-600 font-bold">غير متوفر</span>,
    },
    { label: 'القسم', render: (p) => p.categories?.name || '—' },
    { label: 'الماركة', render: (p) => p.brand || '—' },
    { label: 'كود المنتج', render: (p) => <span dir="ltr">{p.sku || '—'}</span> },
    { label: 'الوصف', render: (p) => <span className="text-sm leading-6 whitespace-pre-line">{p.description || '—'}</span> },
  ]

  const handleAdd = (product) => {
    addToCart(product, 1)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1200)
  }

  return (
    <div className="min-h-[60vh] bg-[#F4F7FB] px-4 py-8" dir="rtl">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B1F3A]">مقارنة المنتجات</h1>
          {saved.length > 0 && (
            <button type="button" onClick={() => clearList('compare')} className="text-sm font-bold text-red-600 hover:underline">
              مسح المقارنة
            </button>
          )}
        </div>

        {!loading && products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-lg font-bold text-[#0B1F3A]">مفيش منتجات للمقارنة</p>
            <p className="text-slate-500 mt-2">اضغط على زرار المقارنة في أي منتج (لحد 4 منتجات) وارجع هنا.</p>
            <Link to="/products" className="inline-flex mt-5 bg-[#0B1F3A] text-white px-6 py-3 rounded-xl font-bold">
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[640px] text-right border-collapse">
              <thead>
                <tr>
                  <th className="w-36 p-4 bg-slate-50 border-b border-slate-200" />
                  {products.map((product) => (
                    <th key={product.id} className="p-4 align-top border-b border-r border-slate-100 font-normal">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => removeFromList('compare', product.id)}
                          aria-label="إزالة من المقارنة"
                          className="absolute top-0 left-0 w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          ×
                        </button>
                        <Link to={`/products/${product.id}`} className="block">
                          <div className="aspect-square max-w-[160px] mx-auto rounded-lg bg-[#F5F7FA] mb-3">
                            {product.image_url && (
                              <img src={product.image_url} alt={product.title} className="w-full h-full object-contain mix-blend-multiply p-3" />
                            )}
                          </div>
                          <p className="font-bold text-sm text-slate-800 leading-6 line-clamp-2 hover:text-[#1D4ED8]">{product.title}</p>
                        </Link>
                        {isProductInStock(product) && (
                          <button
                            type="button"
                            onClick={() => handleAdd(product)}
                            className="mt-3 w-full bg-[#0B1F3A] text-white rounded-md py-2 text-sm font-bold hover:brightness-125"
                          >
                            {addedId === product.id ? 'تمت الإضافة ✓' : 'أضف للسلة'}
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="even:bg-slate-50/60">
                    <th scope="row" className="p-4 text-sm font-bold text-slate-600 border-b border-slate-100 bg-slate-50 align-top">
                      {row.label}
                    </th>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-sm text-slate-700 border-b border-r border-slate-100 align-top">
                        {row.render(product)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
