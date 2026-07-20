import { useRef } from 'react'
import useAboutPage from '../hooks/useAboutPage'
import {
  AboutFeatureIcon,
  AboutFramedMedia,
  AboutHeroMedia,
  AboutMedia,
} from '../components/about/AboutSections'

export default function About() {
  const { aboutPage, loading } = useAboutPage()
  const introRef = useRef(null)

  const scrollToIntro = () => {
    introRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading || !aboutPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500 font-bold">جاري تحميل صفحة من نحن...</p>
      </div>
    )
  }

  const { hero, intro, why, mission, vision } = aboutPage

  return (
    <div className="bg-white" dir="rtl">
      <section className="px-4 pt-4 md:pt-6">
        <div className="max-w-[1500px] mx-auto relative min-h-[360px] md:min-h-[520px] rounded-3xl overflow-hidden">
          <AboutHeroMedia imageUrl={hero.imageUrl} alt={hero.title} />
          <div className="absolute inset-0 bg-black/55" />

          <div className="relative z-10 h-full min-h-[360px] md:min-h-[520px] flex flex-col items-center justify-center text-center px-6 py-16">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-4xl">
              {hero.title}
            </h1>
            <p className="text-white/85 font-bold text-base md:text-xl mt-4">
              {hero.subtitle}
            </p>

            <button
              type="button"
              onClick={scrollToIntro}
              className="mt-10 w-12 h-12 rounded-full bg-[#1E6BB8] text-white flex items-center justify-center hover:bg-[#185894] transition shadow-lg"
              aria-label="انتقل للمحتوى"
            >
              <span className="text-xl leading-none">⌄</span>
            </button>
          </div>
        </div>
      </section>

      <section ref={introRef} className="px-4 py-14 md:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          <AboutFramedMedia className="order-2 md:order-1 aspect-[4/3] overflow-hidden">
            <AboutMedia
              imageUrl={intro.imageUrl}
              alt={intro.title}
              className="w-full h-full min-h-[280px]"
            />
          </AboutFramedMedia>

          <div className="order-1 md:order-2 text-right">
            <h2 className="text-3xl md:text-4xl font-black text-[#0B1F3A] mb-6">
              {intro.title}
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-8 whitespace-pre-line font-bold">
              {intro.content}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-black text-[#0B1F3A] tracking-wide">
              {why.title}
            </h2>
            <p className="text-[#1E6BB8] font-bold text-base md:text-lg mt-3">
              {why.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            <div className="space-y-8 md:space-y-10 order-2 md:order-1">
              {why.features.map((feature, index) => (
                <div
                  key={`${feature.title}-${index}`}
                  className="flex items-start gap-4 md:gap-5 text-right"
                >
                  <div className="flex-shrink-0 pt-1">
                    <AboutFeatureIcon
                      iconKey={feature.iconKey}
                      iconUrl={feature.iconUrl}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-[#0B1F3A] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 font-bold leading-7 text-sm md:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <AboutFramedMedia className="order-1 md:order-2 aspect-[4/5] md:aspect-[3/4] overflow-hidden sticky md:top-28">
              <AboutMedia
                imageUrl={why.imageUrl}
                alt={why.title}
                className="w-full h-full min-h-[320px]"
              />
            </AboutFramedMedia>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="text-right order-1">
            <h2 className="text-3xl md:text-4xl font-black text-[#0B1F3A] mb-6">
              {mission.title}
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-8 whitespace-pre-line font-bold">
              {mission.content}
            </p>
          </div>

          <AboutFramedMedia className="order-2 aspect-[4/3] overflow-hidden">
            <AboutMedia
              imageUrl={mission.imageUrl}
              alt={mission.title}
              className="w-full h-full min-h-[260px]"
            />
          </AboutFramedMedia>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20 pb-20 bg-slate-50/60">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          <AboutFramedMedia className="order-2 md:order-1 aspect-[4/3] overflow-hidden">
            <AboutMedia
              imageUrl={vision.imageUrl}
              alt={vision.title}
              className="w-full h-full min-h-[260px]"
            />
          </AboutFramedMedia>

          <div className="text-right order-1 md:order-2">
            <h2 className="text-3xl md:text-4xl font-black text-[#0B1F3A] mb-6">
              {vision.title}
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-8 whitespace-pre-line font-bold">
              {vision.content}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
