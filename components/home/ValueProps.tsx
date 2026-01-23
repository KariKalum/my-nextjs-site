import Link from 'next/link'
import Section from '@/components/Section'

export default function ValueProps() {
  const props = [
    {
      icon: '📶',
      title: 'Fast Wi-Fi',
      description: 'High-speed internet connections rated by real users. No more buffering during video calls.',
      href: '/find/wifi',
    },
    {
      icon: '🔌',
      title: 'Power Outlets',
      description: 'Plenty of Steckdosen available. Never worry about your laptop battery running out.',
      href: '/find/outlets',
    },
    {
      icon: '🔇',
      title: 'Quiet Spaces',
      description: 'Know before you go. Find quiet spaces for focused work or moderate environments for collaboration.',
      href: '/find/quiet',
    },
    {
      icon: '⏰',
      title: 'Time-Limit Friendly',
      description: 'Work as long as you need. We highlight cafés with no time restrictions.',
      href: '/find/time-limit',
    },
  ]

  return (
    <Section spacing="md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Why Choose Our Directory
          </h2>
          <p className="text-gray-600">
            Find cafés with all the amenities you need for productive remote work
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {props.map((prop, index) => (
            <Link
              key={index}
              href={prop.href}
              className="text-center p-4 md:p-6 rounded-lg border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={`Find cafés with ${prop.title.toLowerCase()}`}
            >
              <div className="text-4xl mb-3 md:mb-4">{prop.icon}</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {prop.title}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {prop.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  )
}
