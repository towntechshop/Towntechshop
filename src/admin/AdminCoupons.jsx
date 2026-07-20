import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState('')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const getCoupons = async () => {
    setLoading(true)
    setErrorMessage('')

    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (searchTerm.trim()) {
      query = query.ilike('code', `%${searchTerm.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      setErrorMessage(error.message)
      setCoupons([])
    } else {
      setCoupons(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    getCoupons()
  }, [searchTerm])

  const resetForm = () => {
    setEditingId(null)
    setCode('')
    setDiscountType('fixed')
    setDiscountValue('')
    setMinOrderAmount('')
    setMaxDiscountAmount('')
    setUsageLimit('')
    setIsActive(true)
    setStartsAt('')
    setExpiresAt('')
    setMessage('')
    setErrorMessage('')
  }

  const handleEdit = (coupon) => {
    setEditingId(coupon.id)
    setCode(coupon.code || '')
    setDiscountType(coupon.discount_type || 'fixed')
    setDiscountValue(coupon.discount_value ?? '')
    setMinOrderAmount(coupon.min_order_amount ?? '')
    setMaxDiscountAmount(coupon.max_discount_amount ?? '')
    setUsageLimit(coupon.usage_limit ?? '')
    setIsActive(Boolean(coupon.is_active))
    setStartsAt(coupon.starts_at ? coupon.starts_at.slice(0, 16) : '')
    setExpiresAt(coupon.expires_at ? coupon.expires_at.slice(0, 16) : '')
    setMessage('')
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const cleanCode = code.trim().toUpperCase()

    if (!cleanCode) {
      setErrorMessage('من فضلك اكتب كود الكوبون')
      setSaving(false)
      return
    }

    if (!discountValue || Number(discountValue) <= 0) {
      setErrorMessage('قيمة الخصم لازم تكون أكبر من 0')
      setSaving(false)
      return
    }

    const payload = {
      code: cleanCode,
      discount_type: discountType,
      discount_value: Number(discountValue || 0),
      min_order_amount: Number(minOrderAmount || 0),
      max_discount_amount: maxDiscountAmount
        ? Number(maxDiscountAmount)
        : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      is_active: isActive,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    let result

    if (editingId) {
      result = await supabase
        .from('coupons')
        .update(payload)
        .eq('id', editingId)
    } else {
      result = await supabase.from('coupons').insert([payload])
    }

    if (result.error) {
      setErrorMessage(result.error.message)
      setSaving(false)
      return
    }

    setMessage(editingId ? 'تم تعديل الكوبون بنجاح' : 'تم إنشاء الكوبون بنجاح')
    resetForm()
    setSaving(false)
    getCoupons()
  }

  const deleteCoupon = async (couponId) => {
    const confirmDelete = window.confirm('هل تريد حذف هذا الكوبون؟')

    if (!confirmDelete) return

    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setMessage('تم حذف الكوبون بنجاح')
    getCoupons()
  }

  const toggleCouponActive = async (coupon) => {
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('coupons')
      .update({
        is_active: !coupon.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', coupon.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    getCoupons()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchTerm(searchInput)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchTerm('')
  }

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('ar-EG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCouponStatus = (coupon) => {
    const now = new Date()

    if (!coupon.is_active) return 'inactive'

    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return 'scheduled'
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return 'expired'
    }

    if (
      coupon.usage_limit !== null &&
      coupon.usage_limit !== undefined &&
      Number(coupon.used_count || 0) >= Number(coupon.usage_limit || 0)
    ) {
      return 'limit_reached'
    }

    return 'active'
  }

  const getStatusLabel = (status) => {
    if (status === 'active') return 'مفعل'
    if (status === 'scheduled') return 'مجدول'
    if (status === 'expired') return 'منتهي'
    if (status === 'limit_reached') return 'اكتمل الاستخدام'
    return 'غير مفعل'
  }

  const getCouponStatusClass = (status) => {
    if (status === 'active') return 'bg-green-50 text-green-700'
    if (status === 'scheduled') return 'bg-blue-50 text-blue-700'
    if (status === 'expired') return 'bg-red-50 text-red-700'
    if (status === 'limit_reached') return 'bg-orange-50 text-orange-700'
    return 'bg-slate-100 text-slate-700'
  }

  const activeCount = coupons.filter((coupon) => getCouponStatus(coupon) === 'active').length
  const inactiveCount = coupons.filter((coupon) => !coupon.is_active).length
  const expiredCount = coupons.filter((coupon) => getCouponStatus(coupon) === 'expired').length

  const renderDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`
    }

    return `${formatMoney(coupon.discount_value)} جنيه`
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            إنشاء وإدارة أكواد الخصم المستخدمة في صفحة إتمام الطلب
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-bold">الإجمالي</p>
            <p className="text-xl font-black text-slate-950">{coupons.length}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-bold">مفعلة</p>
            <p className="text-xl font-black text-green-600">{activeCount}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-bold">منتهية</p>
            <p className="text-xl font-black text-red-600">{expiredCount + inactiveCount}</p>
          </div>
        </div>
      </div>

      {(message || errorMessage) && (
        <div className="mb-5 space-y-3">
          {message && (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl font-bold">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl font-bold">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6"
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950">
              {editingId ? 'تعديل كوبون' : 'إنشاء كوبون جديد'}
            </h2>

            <p className="text-slate-500 mt-1 font-bold text-sm">
              حدد نوع الخصم، قيمته، شروط الاستخدام ومدة الصلاحية
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full md:w-auto bg-slate-100 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              كود الكوبون *
            </label>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="مثال: SAVE20"
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left uppercase"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              نوع الخصم *
            </label>

            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="fixed">مبلغ ثابت</option>
              <option value="percentage">نسبة مئوية</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              قيمة الخصم *
            </label>

            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percentage' ? 'مثال: 10' : 'مثال: 100'}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              أقل قيمة للطلب
            </label>

            <input
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="مثال: 500"
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              أقصى قيمة خصم
            </label>

            <input
              type="number"
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value)}
              placeholder="اختياري"
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              عدد مرات الاستخدام
            </label>

            <input
              type="number"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="اختياري"
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              يبدأ في
            </label>

            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-black text-slate-700">
              ينتهي في
            </label>

            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 mt-1"
              />

              <div>
                <p className="font-black text-slate-900">
                  الكوبون مفعل
                </p>

                <p className="text-slate-500 text-sm font-bold mt-1">
                  عند إلغاء التفعيل لن يستطيع العملاء استخدام هذا الكوبون
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-slate-950 text-white px-7 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {saving
              ? 'جاري الحفظ...'
              : editingId
                ? 'حفظ التعديلات'
                : 'إنشاء الكوبون'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto bg-slate-100 text-slate-950 px-7 py-4 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                قائمة الكوبونات
              </h2>

              <p className="text-slate-500 mt-1 font-bold text-sm">
                ابحث وعدل وفعل أو عطّل كوبونات الخصم
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="ابحث بكود الكوبون..."
                className="w-full lg:w-[320px] border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left uppercase"
                dir="ltr"
              />

              <button
                type="submit"
                className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
              >
                بحث
              </button>

              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-black hover:bg-red-100 transition"
                >
                  مسح
                </button>
              )}
            </form>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-4xl mb-4">
              🎟️
            </div>

            <h3 className="text-2xl font-black text-slate-950">
              لا توجد كوبونات
            </h3>

            <p className="text-slate-500 mt-2 font-bold">
              أنشئ أول كوبون خصم من النموذج بالأعلى.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right min-w-[1100px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 font-black text-slate-700">الكود</th>
                    <th className="p-4 font-black text-slate-700">الخصم</th>
                    <th className="p-4 font-black text-slate-700">أقل طلب</th>
                    <th className="p-4 font-black text-slate-700">أقصى خصم</th>
                    <th className="p-4 font-black text-slate-700">الاستخدام</th>
                    <th className="p-4 font-black text-slate-700">المدة</th>
                    <th className="p-4 font-black text-slate-700">الحالة</th>
                    <th className="p-4 font-black text-slate-700">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon)

                    return (
                      <tr
                        key={coupon.id}
                        className="border-t border-slate-200 hover:bg-slate-50 transition"
                      >
                        <td className="p-4">
                          <div className="inline-flex bg-slate-950 text-white px-3 py-1.5 rounded-xl font-black tracking-wide">
                            {coupon.code}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-black text-slate-900">
                            {renderDiscount(coupon)}
                          </div>

                          <div className="text-xs text-slate-500 font-bold mt-1">
                            {coupon.discount_type === 'percentage'
                              ? 'نسبة مئوية'
                              : 'مبلغ ثابت'}
                          </div>
                        </td>

                        <td className="p-4 font-bold text-slate-700">
                          {formatMoney(coupon.min_order_amount)} جنيه
                        </td>

                        <td className="p-4 font-bold text-slate-700">
                          {coupon.max_discount_amount
                            ? `${formatMoney(coupon.max_discount_amount)} جنيه`
                            : '-'}
                        </td>

                        <td className="p-4">
                          <div className="font-black text-slate-900">
                            {coupon.used_count || 0}
                            {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                          </div>
                        </td>

                        <td className="p-4 text-sm text-slate-600 font-bold leading-7">
                          <div>من: {formatDate(coupon.starts_at)}</div>
                          <div>إلى: {formatDate(coupon.expires_at)}</div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-xs font-black ${getCouponStatusClass(status)}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(coupon)}
                              className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black hover:bg-blue-100 transition"
                            >
                              تعديل
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCouponActive(coupon)}
                              className={
                                coupon.is_active
                                  ? 'bg-orange-50 text-orange-700 px-4 py-2 rounded-xl font-black hover:bg-orange-100 transition'
                                  : 'bg-green-50 text-green-700 px-4 py-2 rounded-xl font-black hover:bg-green-100 transition'
                              }
                            >
                              {coupon.is_active ? 'تعطيل' : 'تفعيل'}
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteCoupon(coupon.id)}
                              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black hover:bg-red-100 transition"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-4 space-y-4">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon)

                return (
                  <div
                    key={coupon.id}
                    className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex bg-slate-950 text-white px-3 py-1.5 rounded-xl font-black tracking-wide">
                          {coupon.code}
                        </div>

                        <p className="mt-3 text-slate-900 font-black text-lg">
                          خصم: {renderDiscount(coupon)}
                        </p>

                        <p className="text-slate-500 font-bold text-sm mt-1">
                          {coupon.discount_type === 'percentage'
                            ? 'نسبة مئوية'
                            : 'مبلغ ثابت'}
                        </p>
                      </div>

                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${getCouponStatusClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 font-bold">أقل طلب</p>
                        <p className="text-slate-950 font-black mt-1">
                          {formatMoney(coupon.min_order_amount)} جنيه
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 font-bold">الاستخدام</p>
                        <p className="text-slate-950 font-black mt-1">
                          {coupon.used_count || 0}
                          {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 font-bold">أقصى خصم</p>
                        <p className="text-slate-950 font-black mt-1">
                          {coupon.max_discount_amount
                            ? `${formatMoney(coupon.max_discount_amount)} جنيه`
                            : '-'}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 font-bold">النهاية</p>
                        <p className="text-slate-950 font-black mt-1 text-xs leading-5">
                          {formatDate(coupon.expires_at)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(coupon)}
                        className="bg-blue-50 text-blue-700 px-3 py-3 rounded-xl font-black hover:bg-blue-100 transition"
                      >
                        تعديل
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCouponActive(coupon)}
                        className={
                          coupon.is_active
                            ? 'bg-orange-50 text-orange-700 px-3 py-3 rounded-xl font-black hover:bg-orange-100 transition'
                            : 'bg-green-50 text-green-700 px-3 py-3 rounded-xl font-black hover:bg-green-100 transition'
                        }
                      >
                        {coupon.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCoupon(coupon.id)}
                        className="bg-red-50 text-red-600 px-3 py-3 rounded-xl font-black hover:bg-red-100 transition"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}