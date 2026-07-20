import { Link } from 'react-router-dom'
import useOurWorkPage from '../hooks/useOurWorkPage'
import OurWorkCarousel from './OurWorkCarousel'

export default function HomeOurWorkSection() {
  const { ourWorkPage, loading } = useOurWorkPage()

  if (loading || !ourWorkPage?.isPublished || !ourWorkPage?.showOnHome || !ourWorkPage.images?.length) {
    return null
  }

  return (
    <section className="px-4 py-8 md:py-9 bg-[#F4F7FB]" dir="rtl">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5 md:mb-6 text-right">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#0B1F3A]">
              {ourWorkPage.homeTitle || ourWorkPage.title}
            </h2>
            {(ourWorkPage.homeSubtitle || ourWorkPage.subtitle) && (
              <p className="text-slate-500 font-bold mt-2 text-sm md:text-base">
                {ourWorkPage.homeSubtitle || ourWorkPage.subtitle}
              </p>
            )}
          </div>

          <Link
            to="/our-work"
            className="inline-flex self-start md:self-auto text-sm md:text-base font-black text-[#1E6BB8] hover:text-[#0B1F3A] transition"
          >
            عرض كل الأعمال ←
          </Link>
        </div>

        <OurWorkCarousel images={ourWorkPage.images} variant="home" />
      </div>
    </section>
  )
}
