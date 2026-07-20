import { Link } from 'react-router-dom'
import useOurWorkPage from '../hooks/useOurWorkPage'
import OurWorkCarousel from '../components/OurWorkCarousel'

export default function OurWork() {
  const { ourWorkPage, loading } = useOurWorkPage()

  if (loading || !ourWorkPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500 font-bold">جاري تحميل صفحة أعمالنا...</p>
      </div>
    )
  }

  if (!ourWorkPage.isPublished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FB] px-4" dir="rtl">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
          الصفحة غير متاحة حالياً
        </h1>
        <p className="text-slate-500 font-bold mb-6 text-center">
          صفحة أعمالنا غير منشورة في الوقت الحالي.
        </p>
        <Link
          to="/"
          className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
        >
          العودة للرئيسية
        </Link>
      </div>
    )
  }

  const images = ourWorkPage.images || []

  return (
    <div className="bg-[#F4F7FB] min-h-screen" dir="rtl">
      <section className="px-4 pt-6 md:pt-8 pb-2 md:pb-4">
        <div className="max-w-[1500px] mx-auto text-center">
          <nav className="text-sm font-bold text-slate-500 mb-4 md:mb-5 text-right">
            <Link to="/" className="hover:text-sky-700 transition">
              الصفحة الرئيسية
            </Link>
            <span className="mx-2 text-slate-300">&gt;</span>
            <span className="text-slate-800">{ourWorkPage.title}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-black text-[#0B1F3A]">
            {ourWorkPage.title}
          </h1>
          {ourWorkPage.subtitle && (
            <p className="text-[#0B1F3A]/75 font-bold text-base md:text-lg mt-3 mx-auto max-w-3xl leading-relaxed">
              {ourWorkPage.subtitle}
            </p>
          )}
        </div>
      </section>

      <section className="px-4 pb-12 md:pb-14">
        <div className="max-w-[1500px] mx-auto">
          {images.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 md:p-16 text-center">
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                لا توجد صور حالياً
              </h2>
              <p className="text-slate-500 font-bold mt-2">
                سيتم إضافة صور الأعمال قريباً.
              </p>
            </div>
          ) : (
            <OurWorkCarousel images={images} variant="page" showHint={false} />
          )}
        </div>
      </section>
    </div>
  )
}
