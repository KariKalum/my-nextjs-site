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
      ? 'py-6'
      : spacing === 'sm'
      ? 'py-8'
      : spacing === 'md'
      ? 'py-10 md:py-12'
      : 'py-16 md:py-20'

  return (
    <section id={id} className={`${spacingClass} ${bgClass} ${className}`}>
      {children}
    </section>
  )
}
