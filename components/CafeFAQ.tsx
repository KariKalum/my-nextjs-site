'use client'

import type { Cafe } from '@/src/lib/supabase/types'
import { buildFaq } from '@/lib/utils/faq-builder'

interface CafeFAQProps {
  cafe: Cafe
}

export default function CafeFAQ({ cafe }: CafeFAQProps) {
  const faqs = buildFaq(cafe)

  // Build FAQPage structured data for SEO
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  return (
    <>
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">❓ Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group rounded-lg border border-gray-200 overflow-hidden transition-colors hover:border-gray-300"
            >
              <summary className="px-4 py-3 bg-gray-50 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex-1">{faq.q}</span>
                  <span 
                    className="text-gray-400 text-xs transition-transform duration-200 group-open:rotate-180 flex-shrink-0" 
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </summary>
              <div className="px-4 py-3 bg-white border-t border-gray-200 text-gray-700 text-sm leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </>
  )
}
