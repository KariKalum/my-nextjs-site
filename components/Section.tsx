interface SectionProps {
  children: React.ReactNode
  className?: string
  backgroundColor?: 'white' | 'gray' | 'primary'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  id?: string
}

export default function Section({
  children,
  className = '',
  backgroundColor = 'white',
  spacing = 'md',
  id,
}: SectionProps) {
  const bgClass =
    backgroundColor === 'gray'
      ? 'bg-gray-50'
      : backgroundColor === 'primary'
      ? 'bg-primary-600'
      : 'bg-white'

  const spacingClass =
    spacing === 'none'
      ? 'py-4 md:py-6'
      : spacing === 'sm'
      ? 'py-6 md:py-8'
      : spacing === 'md'
      ? 'py-8 md:py-12'
      : 'py-12 md:py-20'

  return (
    <section id={id} className={`${spacingClass} ${bgClass} ${className}`}>
      {children}
    </section>
  )
}
