import Reveal from './Reveal'

// شحن / ضمان / استبدال: كروت بأيقونة متحركة وخط بيتملي لما تقف عليه
export default function HomeBenefits({ cards }) {
  if (!cards?.length) return null

  return (
    <section className="px-4 py-4 md:py-6">
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        {cards.map((card, index) => (
          <Reveal key={card.title} delay={index * 120} className="h-full">
            <article className="benefit-card group relative h-full overflow-hidden rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 md:p-6 transition duration-300 hover:-translate-y-1 hover:border-[#1D4ED8]/30 hover:shadow-[0_24px_44px_-28px_rgba(29,78,216,0.55)]">
              <span
                aria-hidden="true"
                className="absolute -top-3 left-4 text-[64px] md:text-[80px] font-bold leading-none text-slate-100 select-none transition-colors duration-300 group-hover:text-[#EEF4FF]"
                dir="ltr"
              >
                0{index + 1}
              </span>

              <div className="relative flex md:flex-col items-center md:items-start gap-4">
                <div className="benefit-icon relative flex-shrink-0 w-[72px] h-[72px] md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#1D4ED8] p-2.5 shadow-[0_14px_28px_-14px_rgba(29,78,216,0.9)]">
                  <span aria-hidden="true" className="benefit-ring absolute inset-0 rounded-2xl border-2 border-[#38BDF8]" />
                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                    {card.icon}
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-[#0B1F3A] leading-snug">{card.title}</h3>
                  <p className="mt-1 md:mt-2 text-slate-500 text-[13px] md:text-sm leading-6">{card.subtitle}</p>
                </div>
              </div>

              <span
                aria-hidden="true"
                className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-l from-[#1D4ED8] to-[#38BDF8] origin-right scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
              />
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
