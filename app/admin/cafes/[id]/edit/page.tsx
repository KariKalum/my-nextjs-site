import { notFound } from 'next/navigation'
import { supabase, type Cafe } from '@/lib/supabase'
import CafeForm from '@/components/CafeForm'

async function getCafe(id: string): Promise<Cafe | null> {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return data as Cafe
  } catch (error) {
    console.error('Error fetching cafe:', error)
    return null
  }
}

export default async function EditCafePage({
  params,
}: {
  params: { id: string }
}) {
  const cafe = await getCafe(params.id)

  if (!cafe) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Café</h1>
        <p className="mt-2 text-gray-600">Update the information for {cafe.name}.</p>
      </div>
      <CafeForm cafe={cafe} mode="edit" />
    </div>
  )
}
