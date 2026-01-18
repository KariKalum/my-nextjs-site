import CafeForm from '@/components/CafeForm'

export default function NewCafePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Café</h1>
        <p className="mt-2 text-gray-600">Fill in the information below to add a new café to the directory.</p>
      </div>
      <CafeForm mode="create" />
    </div>
  )
}
