'use client'

import { t, tmpl } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'

interface CityFAQProps {
  dict: Dictionary
  cityName: string
}

export default function CityFAQ({ dict, cityName }: CityFAQProps) {
  const isBerlin = cityName.toLowerCase() === 'berlin'
  const faqPrefix = isBerlin ? 'meta.city.berlinFaq' : 'meta.city.faq'
  
  const faqs = [
    { q: `${faqPrefix}.q1`, a: `${faqPrefix}.a1` },
    { q: `${faqPrefix}.q2`, a: `${faqPrefix}.a2` },
    { q: `${faqPrefix}.q3`, a: `${faqPrefix}.a3` },
    { q: `${faqPrefix}.q4`, a: `${faqPrefix}.a4` },
    { q: `${faqPrefix}.q5`, a: `${faqPrefix}.a5` },
  ]

  return (
    <section className="mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-5">
          {t(dict, 'meta.city.faq.title')}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group rounded-lg border border-gray-200 bg-white overflow-hidden transition-colors hover:border-gray-300"
            >
              <summary className="px-4 py-3 bg-gray-50 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex-1 text-left text-sm md:text-base">
                    {isBerlin ? t(dict, faq.q) : tmpl(t(dict, faq.q), { city: cityName })}
                  </span>
                  <span
                    className="text-gray-400 text-sm transition-transform duration-200 group-open:rotate-180 flex-shrink-0"
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </summary>
              <div className="px-4 py-3 bg-white border-t border-gray-200 text-gray-700 text-sm leading-relaxed">
                {isBerlin ? t(dict, faq.a) : tmpl(t(dict, faq.a), { city: cityName })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
