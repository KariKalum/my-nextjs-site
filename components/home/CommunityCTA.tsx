import Link from 'next/link'

export default function CommunityCTA() {
  return (
    <section className="py-16 bg-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Know a great spot? Help others work better.
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Share your favorite laptop-friendly café and help the remote work community discover new workspaces.
          </p>
          <Link
            href="/submit"
            className="inline-block px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-colors"
          >
            Submit a café
          </Link>
        </div>
      </div>
    </section>
  )
}
