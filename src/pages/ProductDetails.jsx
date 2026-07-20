import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { addToCart } from '../lib/cart'
import ProductCard from '../components/ProductCard'

const BRAND_COLORS = {
  primary: '#0B1F3A',
  primaryHover: '#10294B',
  accent: '#38BDF8',
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addedProductId, setAddedProductId] = useState(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  const normalizeGallery = (gallery) => {
    if (!gallery) return []

    if (Array.isArray(gallery)) {
      return gallery.filter(Boolean)
    }

    try {
      const parsed = JSON.parse(gallery)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }

  const getProductDetails = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        categories (
          id,
          name
        )
      `
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      setProduct(null)
      setRelatedProducts([])
      setLoading(false)
      return
    }

    setProduct(data)

    const galleryImages = normalizeGallery(data.gallery_urls)
    const firstImage = data.image_url || galleryImages[0] || ''
    setSelectedImage(firstImage)

    let relatedQuery = supabase
      .from('products')
      .select(
        `
        *,
        categories (
          id,
          name
        )
      `
      )
      .eq('is_visible', true)
      .neq('id', data.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data.category_id) {
      relatedQuery = relatedQuery.eq('category_id', data.category_id)
    }

    const { data: relatedData } = await relatedQuery

    if (relatedData && relatedData.length > 0) {
      setRelatedProducts(relatedData)
    } else {
      const { data: latestData } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (
            id,
            name
          )
        `
        )
        .eq('is_visible', true)
        .neq('id', data.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setRelatedProducts(latestData || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    getProductDetails()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  const productImages = useMemo(() => {
    if (!product) return []

    const gallery = normalizeGallery(product.gallery_urls)
    const images = [product.image_url, ...gallery].filter(Boolean)

    return [...new Set(images)]
  }, [product])

  const getProductPrice = (item) => {
    return Number(item?.sale_price || item?.price || item?.regular_price || 0)
  }

  const getRegularPrice = (item) => {
    return Number(item?.regular_price || item?.price || 0)
  }

  const hasSale = (item) => {
    const salePrice = Number(item?.sale_price || 0)
    const regularPrice = Number(item?.regular_price || item?.price || 0)

    return salePrice > 0 && regularPrice > salePrice
  }

  const isProductInStock = (item) => {
    if (item?.is_in_stock === false) return false
    return true
  }

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const handleAddToCart = (item = product, qty = quantity) => {
    if (!item || !isProductInStock(item)) return

    addToCart(item, qty)
    setAddedProductId(item.id)

    setTimeout(() => {
      setAddedProductId(null)
    }, 1200)
  }

  const handleBuyNow = () => {
    if (!product || !isProductInStock(product)) return

    addToCart(product, quantity)
    navigate('/checkout')
  }

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1 text-yellow-400 text-base md:text-lg">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>★</span>
        ))}
      </div>
    )
  }

  const renderRelatedCard = (item) => (
    <ProductCard
      key={item.id}
      product={item}
      added={addedProductId === item.id}
      onAddToCart={(product) => handleAddToCart(product, 1)}
      variant="grid"
    />
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8" dir="rtl">
        <div className="max-w-[1220px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-pulse">
              <div className="h-[370px] bg-slate-100 rounded-2xl" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
              <div className="h-8 bg-slate-100 rounded mb-4" />
              <div className="h-5 bg-slate-100 rounded w-40 mb-5" />
              <div className="h-20 bg-slate-100 rounded mb-5" />
              <div className="h-8 bg-slate-100 rounded w-52 mb-5" />
              <div className="h-11 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-20" dir="rtl">
        <div className="max-w-[900px] mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
          <h1 className="text-3xl font-black text-slate-900">
            المنتج غير موجود
          </h1>

          <p className="text-slate-500 mt-3">
            المنتج غير متاح حاليا أو تم حذفه.
          </p>

          <Link
            to="/products"
            className="inline-flex mt-6 text-white px-7 py-3 rounded-xl font-black hover:opacity-90 transition"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            الرجوع للمنتجات
          </Link>
        </div>
      </div>
    )
  }

  const price = getProductPrice(product)
  const regularPrice = getRegularPrice(product)
  const sale = hasSale(product)
  const inStock = isProductInStock(product)

  return (
    <div className="min-h-screen bg-[#F4F7FB]" dir="rtl">
      <section className="px-4 py-5">
        <div className="max-w-[1220px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-slate-500 font-bold">
              <Link to="/" className="hover:text-slate-900">
                الصفحة الرئيسية
              </Link>

              <span>‹</span>

              <Link to="/products" className="hover:text-slate-900">
                المنتجات
              </Link>

              <span>‹</span>

              <span className="text-slate-900">
                {String(product.title || '').slice(0, 46)}
                {String(product.title || '').length > 46 ? '...' : ''}
              </span>
            </div>

            <Link
              to="/products"
              className="text-slate-600 hover:text-slate-950 font-bold"
            >
              الرجوع للمنتجات
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 h-full">
              <div className="grid grid-cols-1 md:grid-cols-[66px_1fr] gap-3 h-full">
                <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {productImages.length > 0 ? (
                    productImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={
                          selectedImage === image
                            ? 'flex-shrink-0 w-[58px] h-[58px] rounded-xl border-2 border-slate-950 bg-white p-1'
                            : 'flex-shrink-0 w-[58px] h-[58px] rounded-xl border border-slate-200 bg-white p-1 hover:border-slate-500 transition'
                        }
                      >
                        <img
                          src={image}
                          alt={product.title}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="w-[58px] h-[58px] rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                      بدون صورة
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => selectedImage && setImageModalOpen(true)}
                  className="order-1 md:order-2 relative h-[280px] sm:h-[330px] lg:h-[365px] bg-white rounded-2xl flex items-center justify-center overflow-hidden"
                >
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.title}
                      className="w-full h-full object-contain p-3 md:p-5"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">
                      بدون صورة
                    </div>
                  )}
                </button>
              </div>

              <p className="text-center text-slate-500 font-bold mt-2 text-xs">
               
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full flex flex-col">
              <h1 className="text-2xl md:text-[28px] font-black leading-[1.35] text-slate-800 text-right">
                {product.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div>{renderStars()}</div>

                {product.brand && (
                  <p className="text-slate-500 font-bold uppercase text-sm">
                    {product.brand}
                  </p>
                )}
              </div>

              {product.description && (
                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p
                    className="text-slate-600 leading-7 whitespace-pre-line text-sm md:text-base"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {product.description}
                  </p>
                </div>
              )}

              <div className="border-t border-slate-200 my-4" />

              {product.sku && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 font-bold">كود المنتج:</span>
                  <span className="text-slate-900 font-black">
                    {product.sku}
                  </span>
                </div>
              )}

              <div className="mt-5 text-right">
                {sale && (
                  <p className="text-sm text-slate-400 line-through font-bold mb-1">
                    {regularPrice.toLocaleString('en-US')} جنيه
                  </p>
                )}

                <p className="text-3xl md:text-[34px] font-black text-slate-900">
                  {price.toLocaleString('en-US')} جنيه
                </p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 text-base font-black">
                <span className={inStock ? 'text-green-700' : 'text-red-700'}>
                  {inStock ? 'متوفر' : 'غير متوفر'}
                </span>

                <span
                  className={
                    inStock
                      ? 'w-3 h-3 rounded-full bg-green-600'
                      : 'w-3 h-3 rounded-full bg-red-600'
                  }
                />
              </div>

              {typeof product.stock_quantity === 'number' && (
                <p className="text-slate-500 text-sm font-bold mt-1 text-right">
                  الكمية المتاحة: {product.stock_quantity}
                </p>
              )}

              <div className="mt-4">
                <p className="text-slate-700 font-black mb-2">الكمية:</p>

                <div className="flex items-center justify-start border border-slate-200 rounded-xl overflow-hidden w-fit bg-white">
                  <button
                    type="button"
                    onClick={increaseQuantity}
                    className="w-11 h-10 text-xl font-black text-slate-600 hover:bg-slate-50"
                  >
                    +
                  </button>

                  <div className="w-14 h-10 flex items-center justify-center border-x border-slate-200 font-black text-slate-900">
                    {quantity}
                  </div>

                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    className="w-11 h-10 text-xl font-black text-slate-600 hover:bg-slate-50"
                  >
                    -
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product, quantity)}
                  disabled={!inStock}
                  className={
                    inStock
                      ? 'text-white rounded-xl py-3 font-black text-base hover:opacity-90 transition'
                      : 'bg-slate-200 text-slate-500 rounded-xl py-3 font-black text-base cursor-not-allowed'
                  }
                  style={
                    inStock ? { backgroundColor: BRAND_COLORS.primary } : undefined
                  }
                >
                  {addedProductId === product.id
                    ? 'تمت الإضافة'
                    : 'أضف إلى عربة التسوق'}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className={
                    inStock
                      ? 'text-white rounded-xl py-3 font-black text-base hover:opacity-90 transition'
                      : 'bg-slate-200 text-slate-500 rounded-xl py-3 font-black text-base cursor-not-allowed'
                  }
                  style={inStock ? { backgroundColor: '#24308A' } : undefined}
                >
                  اشتر الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <>
          <section className="px-4 pt-8">
            <div className="max-w-[1220px] mx-auto">
              <div
                className="rounded-t-2xl px-6 py-5 flex items-center justify-between text-white"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <h2 className="text-2xl md:text-3xl font-black">
                  قد يعجبك أيضا
                </h2>

                <Link
                  to="/products"
                  className="text-sm md:text-base font-black hover:opacity-80 transition"
                >
                  عرض الكل
                </Link>
              </div>
            </div>
          </section>

          <section className="px-3 sm:px-4 pb-12 md:pb-14">
            <div className="max-w-[1500px] mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 pt-4 sm:pt-5">
                {relatedProducts.map((item) => renderRelatedCard(item))}
              </div>
            </div>
          </section>
        </>
      )}

      {imageModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 p-4 flex items-center justify-center"
          onClick={() => setImageModalOpen(false)}
        >
          <button
            type="button"
            onClick={() => setImageModalOpen(false)}
            className="absolute top-5 left-5 w-12 h-12 rounded-full bg-white text-slate-900 font-black text-2xl"
          >
            ×
          </button>

          <img
            src={selectedImage}
            alt={product.title}
            className="max-w-full max-h-full object-contain bg-white rounded-2xl p-4"
          />
        </div>
      )}
    </div>
  )
}