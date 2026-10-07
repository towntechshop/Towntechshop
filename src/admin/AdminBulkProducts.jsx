import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const cellInput =
  'w-full min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-slate-950 bg-white'

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

// تعديل جماعي للمنتجات: أسعار وخصومات ومخزون وماركة وظهور
export default function AdminBulkProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [dirty, setDirty] = useState(() => new Set())

  const [discountPercent, setDiscountPercent] = useState('')
  const [bulkBrand, setBulkBrand] = useState('')
  const [bulkStock, setBulkStock] = useState('')
  const [priceChangePercent, setPriceChangePercent] = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: productsData, error }, { data: categoriesData }] = await Promise.all([
      supabase
        .from('products')
        .select('id, title, sku, brand, price, regular_price, sale_price, stock_quantity, is_in_stock, is_visible, category_id, image_url')
        .order('title', { ascending: true }),
      supabase.from('categories').select('id, name, parent_id').order('name'),
    ])

    if (error) setErrorMessage(error.message)
    setProducts(
      (productsData || []).map((product) => ({
        ...product,
        regular_price: product.regular_price ?? product.price,
      }))
    )
    setCategories(categoriesData || [])
    setDirty(new Set())
    setSelected(new Set())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  )

  const visibleProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return products.filter((product) => {
      if (categoryFilter !== 'all' && product.category_id !== categoryFilter) return false
      if (!keyword) return true
      return [product.title, product.sku, product.brand].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      )
    })
  }, [products, search, categoryFilter])

  const updateProduct = (id, patch) => {
    setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, ...patch } : product)))
    setDirty((prev) => new Set(prev).add(id))
    setMessage('')
  }

  const applyToSelected = (getPatch) => {
    if (!selected.size) {
      setErrorMessage('اختار منتجات الأول من المربعات اللي على اليمين.')
      return
    }
    setErrorMessage('')
    setProducts((prev) =>
      prev.map((product) => (selected.has(product.id) ? { ...product, ...getPatch(product) } : product))
    )
    setDirty((prev) => {
      const next = new Set(prev)
      selected.forEach((id) => next.add(id))
      return next
    })
    setMessage('')
  }

  const allVisibleSelected =
    visibleProducts.length > 0 && visibleProducts.every((product) => selected.has(product.id))

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visibleProducts.forEach((product) => next.delete(product.id))
      else visibleProducts.forEach((product) => next.add(product.id))
      return next
    })
  }

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const changed = products.filter((product) => dirty.has(product.id))

    for (const product of changed) {
      const regular = toNumberOrNull(product.regular_price)
      let sale = toNumberOrNull(product.sale_price)
      if (sale !== null && regular !== null && sale >= regular) sale = null
      const stock = toNumberOrNull(product.stock_quantity)

      const payload = {
        regular_price: regular,
        price: regular,
        sale_price: sale,
        is_visible: Boolean(product.is_visible),
        brand: String(product.brand || '').trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (stock !== null) {
        payload.stock_quantity = Math.max(Math.round(stock), 0)
        payload.is_in_stock = payload.stock_quantity > 0
      }

      const { error } = await supabase.from('products').update(payload).eq('id', product.id)

      if (error) {
        setErrorMessage(`${product.title}: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setMessage(`تم حفظ ${changed.length} منتج`)
    setSaving(false)
    load()
  }

  return (
    <div dir="rtl" className="space-y-5 pb-24">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-950">تعديل جماعي للمنتجات</h1>
          <p className="text-slate-500 mt-2 font-bold">
            عدّل الأسعار والخصومات والمخزون والماركة لكذا منتج مرة واحدة، وبعدين اضغط حفظ.
          </p>
        </div>
        <Link to="/admin/products" className="font-black text-sky-700 hover:underline">
          الرجوع للمنتجات
        </Link>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 font-bold">{message}</div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold">{errorMessage}</div>
      )}

      {/* أدوات على المنتجات المختارة */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-3">
        <p className="font-black text-slate-900">
          على المنتجات المختارة ({selected.size}):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="90"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              placeholder="خصم %"
              className={cellInput}
            />
            <button
              type="button"
              onClick={() => {
                const percent = Number(discountPercent)
                if (!(percent > 0 && percent < 100)) return
                applyToSelected((product) => ({
                  sale_price: Math.round(Number(product.regular_price || 0) * (1 - percent / 100)),
                }))
              }}
              className="flex-shrink-0 bg-red-600 text-white px-3 rounded-lg font-black text-sm"
            >
              عمل خصم
            </button>
            <button
              type="button"
              onClick={() => applyToSelected(() => ({ sale_price: '' }))}
              className="flex-shrink-0 bg-slate-100 px-3 rounded-lg font-black text-sm"
            >
              شيل الخصم
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={priceChangePercent}
              onChange={(event) => setPriceChangePercent(event.target.value)}
              placeholder="تغيير السعر % (مثلاً 10 أو -5)"
              className={cellInput}
            />
            <button
              type="button"
              onClick={() => {
                const percent = Number(priceChangePercent)
                if (!percent) return
                applyToSelected((product) => ({
                  regular_price: Math.round(Number(product.regular_price || 0) * (1 + percent / 100)),
                  sale_price: product.sale_price
                    ? Math.round(Number(product.sale_price) * (1 + percent / 100))
                    : product.sale_price,
                }))
              }}
              className="flex-shrink-0 bg-slate-950 text-white px-3 rounded-lg font-black text-sm"
            >
              تطبيق
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={bulkBrand}
              onChange={(event) => setBulkBrand(event.target.value)}
              placeholder="الماركة (مثلاً Hikvision)"
              className={cellInput}
            />
            <button
              type="button"
              onClick={() => bulkBrand.trim() && applyToSelected(() => ({ brand: bulkBrand.trim() }))}
              className="flex-shrink-0 bg-slate-950 text-white px-3 rounded-lg font-black text-sm"
            >
              تطبيق
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={bulkStock}
              onChange={(event) => setBulkStock(event.target.value)}
              placeholder="المخزون"
              className={cellInput}
            />
            <button
              type="button"
              onClick={() => bulkStock !== '' && applyToSelected(() => ({ stock_quantity: Number(bulkStock) }))}
              className="flex-shrink-0 bg-slate-950 text-white px-3 rounded-lg font-black text-sm"
            >
              تطبيق
            </button>
            <button
              type="button"
              onClick={() => applyToSelected(() => ({ is_visible: true }))}
              className="flex-shrink-0 bg-slate-100 px-3 rounded-lg font-black text-sm"
            >
              إظهار
            </button>
            <button
              type="button"
              onClick={() => applyToSelected(() => ({ is_visible: false }))}
              className="flex-shrink-0 bg-slate-100 px-3 rounded-lg font-black text-sm"
            >
              إخفاء
            </button>
          </div>
        </div>
      </section>

      {/* فلاتر */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بالاسم أو الكود أو الماركة"
          className="flex-1 border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white font-bold"
        >
          <option value="all">كل الأقسام</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="h-64 animate-pulse bg-slate-50" />
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="w-4 h-4" aria-label="اختيار الكل" />
                </th>
                <th className="p-3 text-right">المنتج</th>
                <th className="p-3 text-right w-36">الماركة</th>
                <th className="p-3 text-right w-28">السعر الأصلي</th>
                <th className="p-3 text-right w-28">سعر الخصم</th>
                <th className="p-3 text-right w-24">المخزون</th>
                <th className="p-3 text-center w-20">ظاهر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProducts.map((product) => {
                const regular = Number(product.regular_price || 0)
                const sale = toNumberOrNull(product.sale_price)
                const percent = sale && regular > sale ? Math.round(((regular - sale) / regular) * 100) : 0

                return (
                  <tr
                    key={product.id}
                    className={`${dirty.has(product.id) ? 'bg-sky-50/60' : ''} ${selected.has(product.id) ? 'bg-amber-50/60' : ''}`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleOne(product.id)}
                        className="w-4 h-4"
                        aria-label={`اختيار ${product.title}`}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image_url && (
                          <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-slate-50 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate max-w-[340px]">{product.title}</p>
                          <p className="text-xs text-slate-500 font-bold">
                            {[product.sku, categoryNames[product.category_id]].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={product.brand || ''}
                        onChange={(event) => updateProduct(product.id, { brand: event.target.value })}
                        className={cellInput}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={product.regular_price ?? ''}
                        onChange={(event) => updateProduct(product.id, { regular_price: event.target.value })}
                        className={cellInput}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={product.sale_price ?? ''}
                        onChange={(event) => updateProduct(product.id, { sale_price: event.target.value })}
                        placeholder="بدون"
                        className={cellInput}
                      />
                      {percent > 0 && <p className="text-[11px] text-red-600 font-black mt-1">خصم {percent}%</p>}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={product.stock_quantity ?? ''}
                        onChange={(event) => updateProduct(product.id, { stock_quantity: event.target.value })}
                        className={cellInput}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(product.is_visible)}
                        onChange={(event) => updateProduct(product.id, { is_visible: event.target.checked })}
                        className="w-4 h-4"
                        aria-label="ظاهر في الموقع"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 md:right-auto md:left-0 md:w-full z-30 bg-white/95 backdrop-blur border-t border-slate-200 p-3">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-3">
          <p className="text-sm font-black text-slate-700">
            {dirty.size ? `${dirty.size} منتج متعدّل ومحتاج حفظ` : 'مفيش تعديلات'}
          </p>
          <div className="flex gap-2">
            {dirty.size > 0 && (
              <button
                type="button"
                onClick={load}
                className="bg-slate-100 px-4 py-3 rounded-2xl font-black"
              >
                إلغاء التعديلات
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || dirty.size === 0}
              className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
