import type { Cafe } from '@/lib/supabase'

interface CafeFAQProps {
  cafe: Cafe
}

interface FAQ {
  question: string
  answer: string
}

export default function CafeFAQ({ cafe }: CafeFAQProps) {
  const faqs: FAQ[] = []

  // FAQ 1: Is it good for working on a laptop?
  if (cafe.is_work_friendly !== undefined || cafe.work_score !== null || cafe.overall_laptop_rating !== null) {
    const isWorkFriendly = cafe.is_work_friendly === true || 
      (cafe.is_work_friendly === undefined && (cafe.work_score !== null || cafe.overall_laptop_rating !== null))
    
    let answer = ''
    if (cafe.work_score !== null) {
      answer = `Yes, ${cafe.name} has a work score of ${cafe.work_score}/10. `
    } else if (cafe.overall_laptop_rating) {
      answer = `Yes, ${cafe.name} has an overall laptop rating of ${cafe.overall_laptop_rating.toFixed(1)}/5. `
    } else {
      answer = `Yes, ${cafe.name} is ${isWorkFriendly ? 'good' : 'suitable'} for working on a laptop. `
    }

    if (cafe.wifi_available && cafe.power_outlets_available) {
      answer += 'It offers WiFi and power outlets for laptop users.'
    } else if (cafe.wifi_available) {
      answer += 'It offers WiFi for laptop users.'
    } else if (cafe.power_outlets_available) {
      answer += 'It offers power outlets for laptop users.'
    }

    faqs.push({
      question: `Is ${cafe.name} good for working on a laptop?`,
      answer: answer.trim(),
    })
  }

  // FAQ 2: Does it have Wi-Fi? Is it fast?
  if (cafe.wifi_available) {
    let answer = `Yes, ${cafe.name} offers free WiFi.`
    if (cafe.wifi_speed_rating) {
      answer += ` The WiFi speed is rated ${cafe.wifi_speed_rating}/5.`
    }
    if (cafe.wifi_password_required) {
      answer += ' A password is required to connect.'
      if (cafe.wifi_password) {
        answer += ' You can ask staff for the WiFi password.'
      }
    }

    faqs.push({
      question: `Does ${cafe.name} have Wi-Fi? Is it fast?`,
      answer,
    })
  }

  // FAQ 3: Are power outlets available?
  if (cafe.power_outlets_available !== undefined) {
    let answer = cafe.power_outlets_available 
      ? `Yes, ${cafe.name} has power outlets available for charging devices.`
      : `No, ${cafe.name} does not have power outlets available.`
    
    if (cafe.power_outlets_available && cafe.power_outlet_rating) {
      answer += ` The outlet availability is rated ${cafe.power_outlet_rating}/5.`
    }

    faqs.push({
      question: `Are power outlets available at ${cafe.name}?`,
      answer,
    })
  }

  // FAQ 4: How noisy is it?
  if (cafe.noise_level) {
    const noiseDescriptions: Record<string, string> = {
      quiet: 'quiet and suitable for focused work',
      moderate: 'moderately noisy with a good balance for work and conversation',
      loud: 'lively and energetic, better suited for collaborative work',
      variable: 'noise level varies throughout the day',
    }

    let answer = `${cafe.name} has a ${cafe.noise_level} atmosphere. `
    answer += noiseDescriptions[cafe.noise_level] || 'The noise level is ' + cafe.noise_level + '.'
    
    if (!cafe.conversation_friendly && cafe.noise_level === 'quiet') {
      answer += ' It maintains a quiet environment for focused work.'
    }

    faqs.push({
      question: `How noisy is ${cafe.name}?`,
      answer,
    })
  }

  // FAQ 5: Is there a time limit for laptops?
  if (cafe.time_limit_minutes !== undefined || cafe.laptop_policy) {
    let answer = ''
    if (cafe.time_limit_minutes && cafe.time_limit_minutes > 0) {
      const hours = Math.floor(cafe.time_limit_minutes / 60)
      const minutes = cafe.time_limit_minutes % 60
      if (hours > 0) {
        answer = `Yes, there is a time limit of ${hours} hour${hours > 1 ? 's' : ''}`
        if (minutes > 0) {
          answer += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`
        }
        answer += ` for laptop use at ${cafe.name}.`
      } else {
        answer = `Yes, there is a time limit of ${minutes} minute${minutes > 1 ? 's' : ''} for laptop use at ${cafe.name}.`
      }
    } else {
      answer = `No, there is no time limit for laptop use at ${cafe.name}. You can work as long as you like.`
    }

    if (cafe.laptop_policy) {
      answer += ` ${cafe.name}'s laptop policy: ${cafe.laptop_policy}.`
    }

    faqs.push({
      question: `Is there a time limit for laptops at ${cafe.name}?`,
      answer,
    })
  }

  // FAQ 6: Pet-friendly
  if (cafe.pet_friendly !== undefined) {
    faqs.push({
      question: `Is ${cafe.name} pet-friendly?`,
      answer: cafe.pet_friendly 
        ? `Yes, ${cafe.name} is pet-friendly and welcomes pets.`
        : `No, ${cafe.name} is not pet-friendly.`,
    })
  }

  // FAQ 7: Outdoor seating
  if (cafe.outdoor_seating !== undefined) {
    faqs.push({
      question: `Does ${cafe.name} have outdoor seating?`,
      answer: cafe.outdoor_seating
        ? `Yes, ${cafe.name} offers outdoor seating.`
        : `No, ${cafe.name} does not have outdoor seating.`,
    })
  }

  // FAQ 8: Wheelchair accessible
  if (cafe.accessible !== undefined) {
    faqs.push({
      question: `Is ${cafe.name} wheelchair accessible?`,
      answer: cafe.accessible
        ? `Yes, ${cafe.name} is wheelchair accessible.`
        : `No, ${cafe.name} is not wheelchair accessible.`,
    })
  }

  // FAQ 9: Seating capacity
  if (cafe.seating_capacity > 0) {
    faqs.push({
      question: `How many seats does ${cafe.name} have?`,
      answer: `${cafe.name} has seating capacity for ${cafe.seating_capacity} people.`,
    })
  }

  // FAQ 10: Parking
  if (cafe.parking_available !== undefined) {
    let answer = cafe.parking_available
      ? `Yes, ${cafe.name} has parking available.`
      : `No, ${cafe.name} does not have parking available.`
    
    if (cafe.parking_available && cafe.parking_type) {
      answer += ` Parking type: ${cafe.parking_type}.`
    }

    faqs.push({
      question: `Does ${cafe.name} have parking?`,
      answer,
    })
  }

  if (faqs.length === 0) {
    return null
  }

  // Build FAQPage structured data
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <dl className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
              <dt className="text-lg font-semibold text-gray-900 mb-2">
                {faq.question}
              </dt>
              <dd className="text-gray-700 leading-relaxed">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </>
  )
}
