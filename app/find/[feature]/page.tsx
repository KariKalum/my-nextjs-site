import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import FeaturePageTemplate from '@/components/FeaturePageTemplate'

const FEATURE_CONFIGS: Record<string, { title: string; description: string }> = {
  wifi: {
    title: 'Find cafés with fast Wi-Fi | Café Directory',
    description: 'Discover laptop-friendly cafés with high-speed internet connections. Perfect for video calls, streaming, and productive remote work.',
  },
  outlets: {
    title: 'Find cafés with power outlets | Café Directory',
    description: 'Never worry about your laptop battery. Find cafés with plenty of power outlets (Steckdosen) to keep you charged all day.',
  },
  quiet: {
    title: 'Find quiet cafés | Café Directory',
    description: 'Focus without distractions. Discover cafés with quiet or moderate noise levels, perfect for deep work and concentration.',
  },
  'time-limit': {
    title: 'Find time-limit friendly cafés | Café Directory',
    description: 'Work as long as you need. Explore cafés with no time restrictions, so you can stay productive without worrying about time limits.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: { feature: string }
}): Promise<Metadata> {
  const config = FEATURE_CONFIGS[params.feature]

  if (!config) {
    return {
      title: 'Feature not found | Café Directory',
    }
  }

  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      type: 'website',
    },
  }
}

export default function FeaturePage({
  params,
}: {
  params: { feature: string }
}) {
  const validFeatures = ['wifi', 'outlets', 'quiet', 'time-limit']

  if (!validFeatures.includes(params.feature)) {
    notFound()
  }

  return <FeaturePageTemplate feature={params.feature} />
}
