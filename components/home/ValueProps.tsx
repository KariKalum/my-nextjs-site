import Section from '@/components/Section'

export default function ValueProps() {
  const props = [
    {
      icon: '📶',
      title: 'Fast Wi-Fi',
      description: 'High-speed internet connections rated by real users. No more buffering during video calls.',
    },
    {
      icon: '🔌',
      title: 'Power Outlets',
      description: 'Plenty of Steckdosen available. Never worry about your laptop battery running out.',
    },
    {
      icon: '🔇',
      title: 'Noise Levels',
      description: 'Know before you go. Find quiet spaces for focused work or moderate environments for collaboration.',
    },
    {
      icon: '⏰',
      title: 'Time-Limit Friendly',
      description: 'Work as long as you need. We highlight cafés with no time restrictions.',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {props.map((prop, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{prop.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {prop.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
