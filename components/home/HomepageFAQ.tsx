'use client'

import Section from '@/components/Section'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'

export default function HomepageFAQ({ dict }: { dict: Dictionary }) {
  const faqs = [
    { q: 'home.faq.q1', a: 'home.faq.a1' },
    { q: 'home.faq.q2', a: 'home.faq.a2' },
    { q: 'home.faq.q3', a: 'home.faq.a3' },
    { q: 'home.faq.q4', a: 'home.faq.a4' },
    { q: 'home.faq.q5', a: 'home.faq.a5' },
  ]

  return (
    <Section spacing="md" backgroundColor="gray">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 text-center">
          {t(dict, 'home.faq.title')}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group rounded-lg border border-gray-200 bg-white overflow-hidden transition-colors hover:border-gray-300"
            >
              <summary className="px-4 py-3 bg-gray-50 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex-1 text-left">{t(dict, faq.q)}</span>
                  <span
                    className="text-gray-400 text-sm transition-transform duration-200 group-open:rotate-180 flex-shrink-0"
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </summary>
              <div className="px-4 py-3 bg-white border-t border-gray-200 text-gray-700 text-sm leading-relaxed">
                {t(dict, faq.a)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}
