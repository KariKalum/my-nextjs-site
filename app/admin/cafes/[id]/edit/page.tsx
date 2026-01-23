import { notFound } from 'next/navigation'
import { supabase, type Cafe } from '@/lib/supabase'
import CafeForm from '@/components/CafeForm'

export default async function EditCafePage({
  params,
}: {
  params: { id: string }
}) {
  const { data: cafe, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('id', params.id)
    .single()

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
