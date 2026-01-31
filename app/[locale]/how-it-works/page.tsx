import { Metadata } from 'next'
import Link from 'next/link'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { prefixWithLocale } from '@/lib/i18n/routing'
import { getHreflangAlternates } from '@/lib/seo/metadata'

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  return {
    title: 'How workfrom.cafe works | Café Directory',
    description:
      'How Café Directory decides what’s work-friendly: AI signals, human review, and how you can help improve the directory.',
    ...getHreflangAlternates('/how-it-works', locale),
  }
}

export default function HowItWorksPage({
  params,
}: {
  params: { locale: Locale }
}) {
  const locale = getLocaleFromParams(params)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={prefixWithLocale('/', locale)}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            ← Back to directory
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          How workfrom.cafe works
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          How Café Directory decides what’s “work-friendly” and how you can help.
        </p>

        <article className="space-y-12 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>🧠</span>
              How Café Directory decides what’s “work-friendly”
            </h2>
            <p className="mb-4">
              Café Directory is here to help you find cafés where working is likely to feel
              comfortable — not to judge cafés or guarantee a perfect experience ☕💻
            </p>
            <p>
              Think of it as a <strong>smart starting point</strong>, not a final answer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>✨</span>
              First: how cafés get listed
            </h2>
            <p className="mb-4">
              Cafés are initially listed automatically with the help of AI 🤖 The AI looks for
              recurring work-related signals in Google reviews, not single opinions or one-off
              comments.
            </p>
            <p className="mb-2">It’s not asking:</p>
            <p className="mb-4 italic">“Did one person like working here?”</p>
            <p className="mb-2">It’s asking:</p>
            <p className="mb-4 italic">“Do people repeatedly mention things that matter for working?”</p>
            <p>This helps surface cafés that generally meet basic work needs.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>🪑</span>
              What “work-friendly” means here
            </h2>
            <p className="mb-4">
              When we say work-friendly, we’re talking about common signals like:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>📶</span>
                <span>Mentions of Wi-Fi</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🔌</span>
                <span>References to power outlets</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>💺</span>
                <span>Seating that supports laptop use</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🤫</span>
                <span>Notes about noise or focus</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>💻</span>
                <span>Indications that laptops are welcome (at least part of the day)</span>
              </li>
            </ul>
            <p>
              This is a <strong>filter</strong>, not a ranking. A café being listed doesn’t mean
              it’s “better” — just that it likely meets basic work criteria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>🕰️</span>
              Why things aren’t always perfect
            </h2>
            <p className="mb-4">Cafés change. A lot.</p>
            <ul className="list-none space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>☀️</span>
                <span>Quiet mornings can turn loud in the afternoon</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>📜</span>
                <span>Laptop policies can change</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>📡</span>
                <span>Wi-Fi quality can improve or disappear</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🔄</span>
                <span>Owners, layouts, and vibes evolve</span>
              </li>
            </ul>
            <p>
              Google reviews reflect past experiences, so some information may be outdated by the
              time you visit — and that’s totally normal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>🧑‍💻</span>
              Then comes the human part
            </h2>
            <p className="mb-4">
              After the AI does the initial work, humans step in. Admins may manually:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>✏️</span>
                <span>Adjust listings</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🔄</span>
                <span>Update information</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🚫</span>
                <span>Reclassify or remove cafés</span>
              </li>
            </ul>
            <p className="mb-2">This happens when:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Café owners contact us with verified updates</li>
              <li>Users submit reviews or suggest edits</li>
              <li>Clear changes are confirmed through trusted input</li>
            </ul>
            <p>
              <strong>AI helps scale. Humans add judgment.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>🌱</span>
              Why some great cafés might be missing
            </h2>
            <p className="mb-4">
              If a café isn’t listed, it doesn’t mean it’s not work-friendly. It might be:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>🆕</span>
                <span>New</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🗣️</span>
                <span>Under-reviewed</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>👀</span>
                <span>Not yet discovered by the community</span>
              </li>
            </ul>
            <p>That’s why Café Directory is intentionally community-driven.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>🤝</span>
              How you can help improve it
            </h2>
            <p className="mb-4">You can make the directory better by:</p>
            <ul className="list-none space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>🚨</span>
                <span>Reporting incorrect information</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🛠️</span>
                <span>Suggesting updates</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>📝</span>
                <span>Sharing a recent experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>➕</span>
                <span>Adding a missing café</span>
              </li>
            </ul>
            <p className="mb-4">Over time, this helps:</p>
            <ul className="list-none space-y-1 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>⬇️</span>
                <span>Remove cafés that don’t belong</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>⬆️</span>
                <span>Surface great spots we may have missed</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span aria-hidden>🧭</span>
              One last thing
            </h2>
            <p className="mb-4">
              Café Directory shows <strong>signals</strong>, not promises. Your experience can
              depend on:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>⏰</span>
                <span>Time of day</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>📅</span>
                <span>Day of the week</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>👥</span>
                <span>Crowd size</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🙋</span>
                <span>Staff policies</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🧠</span>
                <span>Your personal work style</span>
              </li>
            </ul>
            <p>
              Use the directory as a guide, then help shape it into something even better for
              everyone who works from cafés.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href={prefixWithLocale('/', locale)}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to directory
          </Link>
        </div>
      </main>
    </div>
  )
}
