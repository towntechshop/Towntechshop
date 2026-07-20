import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  addToCart,
  clearCart,
  getCartItems,
  getCheckoutOrderNotes,
  getProductPrice,
  removeCartItem,
  setCheckoutOrderNotes,
  updateCartItemQuantity,
} from '../lib/cart'

const BRAND_COLORS = {
  primary: '#0B1F3A',
  primaryHover: '#10294B',
  accent: '#38BDF8',
}

export default function Cart() {
  const navigate = useNavigate()

  const [cartItems, setCartItems] = useState([])
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [orderNotes, setOrderNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [showShipping, setShowShipping] = useState(false)
  const [addedProductId, setAddedProductId] = useState(null)

  const [shippingFee, setShippingFee] = useState(0)
  const [enableFreeShipping, setEnableFreeShipping] = useState(false)
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState(0)

  const loadCart = () => {
    setCartItems(getCartItems())
  }

  const getShippingSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('shipping_fee, enable_free_shipping, free_shipping_min_amount')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

    if (data) {
      setShippingFee(Number(data.shipping_fee || 0))
      setEnableFreeShipping(Boolean(data.enable_free_shipping))
      setFreeShippingMinAmount(Number(data.free_shipping_min_amount || 0))
    }
  }

  const loadRecommendedProducts = async () => {
    const currentCart = getCartItems()
    const currentCartIds = currentCart.map((item) => item.id)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(12)

    const filteredProducts = (data || []).filter(
      (product) => !currentCartIds.includes(product.id)
    )

    setRecommendedProducts(filteredProducts)
  }

  useEffect(() => {
    loadCart()
    loadRecommendedProducts()
    getShippingSettings()

    const savedNotes = getCheckoutOrderNotes()
    if (savedNotes) {
      setOrderNotes(savedNotes)
    }

    const handleCartUpdate = () => {
      loadCart()
      loadRecommendedProducts()
    }

    window.addEventListener('cart-updated', handleCartUpdate)

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
    }
  }, [])

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = getProductPrice(item)
      const quantity = Number(item.quantity || 1)

      return total + price * quantity
    }, 0)
  }, [cartItems])

  const shouldShowShippingInfo = shippingFee > 0
  const shouldShowFreeShippingMessage =
    shippingFee > 0 && enableFreeShipping && freeShippingMinAmount > 0

  const freeShippingApplied =
    shouldShowFreeShippingMessage && subtotal >= freeShippingMinAmount

  const remainingForFreeShipping =
    shouldShowFreeShippingMessage && subtotal < freeShippingMinAmount
      ? freeShippingMinAmount - subtotal
      : 0

  const finalShippingFee = freeShippingApplied ? 0 : shippingFee
  const total = subtotal + finalShippingFee

  const handleIncrease = (item) => {
    updateCartItemQuantity(item.id, Number(item.quantity || 1) + 1)
    loadCart()
  }

  const handleDecrease = (item) => {
    const currentQuantity = Number(item.quantity || 1)

    if (currentQuantity <= 1) return

    updateCartItemQuantity(item.id, currentQuantity - 1)
    loadCart()
  }

  const handleRemove = (productId) => {
    removeCartItem(productId)
    loadCart()
  }

  const handleClearCart = () => {
    const confirmClear = window.confirm('هل تريد تفريغ عربة التسوق بالكامل؟')

    if (!confirmClear) return

    clearCart()
    loadCart()
  }

  const handleCheckout = () => {
    setCheckoutOrderNotes(orderNotes)
    navigate('/checkout')
  }

  const handleAddRecommended = (product) => {
    addToCart(product, 1)
    setAddedProductId(product.id)

    setTimeout(() => {
      setAddedProductId(null)
    }, 1200)
  }

  const getRecommendedPrice = (product) => {
    return Number(product.sale_price || product.price || product.regular_price || 0)
  }

  const hasRecommendedSale = (product) => {
    const salePrice = Number(product.sale_price || 0)
    const regularPrice = Number(product.regular_price || product.price || 0)

    return salePrice > 0 && regularPrice > salePrice
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-12" dir="rtl">
        <div className="max-w-[1100px] mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-5xl mb-6">
              🛒
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-900">
              عربة التسوق فارغة
            </h1>

            <p className="text-slate-500 mt-4 text-lg">
              ابدأ بإضافة منتجات لعربة التسوق علشان تكمل طلبك.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center justify-center mt-8 px-8 py-4 rounded-2xl text-white font-black text-lg hover:opacity-90 transition"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8" dir="rtl">
      <div className="max-w-[1380px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900">
              عربة مشترياتي
            </h1>

            <p className="text-slate-500 mt-2 font-bold">
              لديك {cartItems.length} منتج في عربة التسوق
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCart}
            className="w-fit bg-red-50 text-red-600 px-5 py-3 rounded-xl font-black hover:bg-red-100 transition"
          >
            تفريغ العربة
          </button>
        </div>

        {shouldShowFreeShippingMessage && (
          <div className="mb-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div
              className="p-5 md:p-6 text-white"
              style={{
                background:
                  'linear-gradient(135deg, #0B1F3A 0%, #123D68 55%, #07111F 100%)',
              }}
            >
              {freeShippingApplied ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black">
                      مبروك! طلبك حصل على شحن مجاني
                    </h2>

                    <p className="text-white/75 mt-2 font-bold">
                      قيمة طلبك وصلت للحد المطلوب للشحن المجاني.
                    </p>
                  </div>

                  <div className="bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-center">
                    الشحن مجاني
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black">
                        اطلب بـ {formatPrice(freeShippingMinAmount)} جنيه أو أكثر وخد شحن مجاني
                      </h2>

                      <p className="text-white/75 mt-2 font-bold">
                        باقي لك {formatPrice(remainingForFreeShipping)} جنيه فقط للحصول على شحن مجاني.
                      </p>
                    </div>

                    <Link
                      to="/products"
                      className="bg-white text-[#0B1F3A] px-5 py-3 rounded-2xl font-black text-center hover:bg-sky-50 transition"
                    >
                      كمل تسوق
                    </Link>
                  </div>

                  <div className="mt-5 bg-white/15 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#38BDF8]"
                      style={{
                        width: `${Math.min(
                          (subtotal / freeShippingMinAmount) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside className="order-2 lg:order-1">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 lg:sticky lg:top-24">
              <h2 className="text-2xl font-black text-slate-900 mb-5">
                ملخص الطلب
              </h2>

              <div className="space-y-4 border-b border-slate-200 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-bold">إجمالي المنتجات</span>
                  <span className="text-slate-900 font-black">
                    {formatPrice(subtotal)} جنيه
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-bold">الشحن</span>

                  {shouldShowShippingInfo ? (
                    <span
                      className={
                        freeShippingApplied
                          ? 'text-green-600 font-black'
                          : 'text-slate-900 font-black'
                      }
                    >
                      {freeShippingApplied
                        ? 'مجاني'
                        : `${formatPrice(shippingFee)} جنيه`}
                    </span>
                  ) : (
                    <span className="text-slate-900 font-black">
                      يتم تحديده لاحقا
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-5 border-b border-slate-200">
                <span className="text-xl font-black text-slate-900">
                  الإجمالي
                </span>

                <span className="text-3xl font-black text-slate-900">
                  {formatPrice(total)} جنيه
                </span>
              </div>

              <div className="py-5 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full flex items-center justify-between gap-4 text-slate-900 font-black"
                >
                  <span>ملاحظات الطلب</span>
                  <span>{showNotes ? '⌃' : '⌄'}</span>
                </button>

                {showNotes && (
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظة على الطلب..."
                    className="mt-4 w-full border border-slate-300 rounded-2xl p-4 min-h-[120px] outline-none focus:border-slate-900 text-right"
                  />
                )}
              </div>

              <div className="py-5 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowShipping(!showShipping)}
                  className="w-full flex items-center justify-between gap-4 text-slate-900 font-black"
                >
                  <span>تكلفة الشحن</span>
                  <span>{showShipping ? '⌃' : '⌄'}</span>
                </button>

                {showShipping && (
                  <div className="text-slate-500 leading-7 mt-4">
                    {shouldShowShippingInfo ? (
                      <>
                        <p>
                          تكلفة الشحن الحالية: {formatPrice(shippingFee)} جنيه.
                        </p>

                        {shouldShowFreeShippingMessage && (
                          <p className="mt-2">
                            الشحن مجاني عند وصول الطلب إلى{' '}
                            {formatPrice(freeShippingMinAmount)} جنيه أو أكثر.
                          </p>
                        )}
                      </>
                    ) : (
                      <p>
                        تكلفة الشحن يتم تحديدها أثناء إنهاء الطلب حسب المحافظة
                        والمنطقة.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="mt-6 w-full text-white rounded-2xl py-4 font-black text-xl hover:opacity-90 transition"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                إتمام الطلب
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-slate-500 font-black">
                <span>طلب آمن 100%</span>
                <span>🔒</span>
              </div>
            </div>
          </aside>

          <section className="order-1 lg:order-2">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.5fr_150px_150px_80px] gap-4 px-6 py-5 border-b border-slate-200 text-slate-500 font-black">
                <div className="text-right">المنتج</div>
                <div className="text-center">الكمية</div>
                <div className="text-center">الإجمالي</div>
                <div className="text-center">حذف</div>
              </div>

              <div className="divide-y divide-slate-200">
                {cartItems.map((item) => {
                  const price = getProductPrice(item)
                  const quantity = Number(item.quantity || 1)
                  const itemTotal = price * quantity

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1.5fr_150px_150px_80px] gap-4 px-4 md:px-6 py-5 items-center"
                    >
                      <div className="flex items-center gap-4">
                        <Link
                          to={`/products/${item.id}`}
                          className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden p-2"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">
                              بدون صورة
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 text-right">
                          {(item.brand || item.sku) && (
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                              {item.brand || item.sku}
                            </p>
                          )}

                          <Link to={`/products/${item.id}`}>
                            <h3
                              className="text-slate-900 font-black text-base md:text-lg leading-7 hover:text-sky-700 transition"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {item.title}
                            </h3>
                          </Link>

                          <p className="mt-2 text-slate-900 font-black">
                            {formatPrice(price)} جنيه
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-center">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleIncrease(item)}
                            className="w-11 h-10 text-xl font-black text-slate-600 hover:bg-slate-50"
                          >
                            +
                          </button>

                          <div className="w-14 h-10 flex items-center justify-center border-x border-slate-200 text-slate-900 font-black">
                            {quantity}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDecrease(item)}
                            className="w-11 h-10 text-xl font-black text-slate-600 hover:bg-slate-50"
                          >
                            −
                          </button>
                        </div>
                      </div>

                      <div className="text-right md:text-center">
                        <p className="text-xl font-black text-slate-900">
                          {formatPrice(itemTotal)}
                        </p>
                        <span className="text-slate-500 font-bold">جنيه</span>
                      </div>

                      <div className="flex md:justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="bg-red-50 text-red-600 w-11 h-11 rounded-xl font-black hover:bg-red-100 transition flex items-center justify-center"
                          title="حذف المنتج"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-between">
              <Link
                to="/products"
                className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-xl font-black hover:bg-slate-50 transition text-center"
              >
                متابعة التسوق
              </Link>

              <button
                type="button"
                onClick={handleCheckout}
                className="text-white px-6 py-3 rounded-xl font-black hover:opacity-90 transition"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                إتمام الطلب
              </button>
            </div>
          </section>
        </div>

        {recommendedProducts.length > 0 && (
          <section className="mt-14">
            <div
              className="rounded-t-2xl px-6 py-5 flex items-center justify-between text-white"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              <h2 className="text-2xl md:text-3xl font-black">
                أكمل عربة التسوق الخاصة بك
              </h2>

              <Link to="/products" className="font-black hover:opacity-80">
                عرض الكل
              </Link>
            </div>

            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 pt-5">
              {recommendedProducts.slice(0, 5).map((product) => {
                const price = getRecommendedPrice(product)
                const sale = hasRecommendedSale(product)
                const regularPrice = Number(product.regular_price || product.price || 0)

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-3 md:p-4 text-right"
                  >
                    <Link
                      to={`/products/${product.id}`}
                      className="block h-28 sm:h-32 md:h-36 mb-3"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-contain transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                          بدون صورة
                        </div>
                      )}
                    </Link>

                    <Link to={`/products/${product.id}`}>
                      <h3
                        className="text-slate-800 font-black text-[14px] md:text-[15px] leading-6 min-h-[44px] hover:text-sky-700 transition"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {product.title}
                      </h3>
                    </Link>

                    <div className="mt-2 min-h-[48px]">
                      {sale && (
                        <p className="text-xs text-slate-400 line-through font-bold">
                          جنيه {formatPrice(regularPrice)}
                        </p>
                      )}

                      <p className="text-lg md:text-xl font-black text-slate-900">
                        {formatPrice(price)} جنيه
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddRecommended(product)}
                      className="mt-3 w-full text-white rounded-xl py-2.5 md:py-3 font-black transition hover:opacity-90"
                      style={{ backgroundColor: BRAND_COLORS.primary }}
                    >
                      {addedProductId === product.id
                        ? 'تمت الإضافة'
                        : 'إضافة إلى العربة'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="md:hidden flex gap-4 overflow-x-auto pt-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recommendedProducts.slice(0, 8).map((product) => {
                const price = getRecommendedPrice(product)

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[210px] bg-white rounded-2xl border border-slate-200 shadow-sm p-3 text-right"
                  >
                    <Link to={`/products/${product.id}`} className="block h-28 mb-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          بدون صورة
                        </div>
                      )}
                    </Link>

                    <h3
                      className="font-black text-slate-900 leading-6 min-h-[48px]"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {product.title}
                    </h3>

                    <p className="mt-2 font-black text-slate-900">
                      {formatPrice(price)} جنيه
                    </p>

                    <button
                      type="button"
                      onClick={() => handleAddRecommended(product)}
                      className="mt-3 w-full text-white rounded-xl py-2.5 font-black"
                      style={{ backgroundColor: BRAND_COLORS.primary }}
                    >
                      {addedProductId === product.id ? 'تمت الإضافة' : 'إضافة'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}