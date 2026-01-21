export default function BetaNotice() {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong className="font-semibold">Beta Notice:</strong>{' '}
              This website is currently in a pre-launch (beta) phase. All content, data, features, and functionality are subject to change and may be incomplete, inaccurate, or outdated.
            </p>
            <p className="text-sm text-yellow-700 mt-1.5">
              Information displayed on this site is provided for testing and preview purposes only and should not be relied upon for final decisions. We do not guarantee the accuracy, completeness, or reliability of any information during this phase.
            </p>
            <p className="text-sm text-yellow-700 mt-1.5">
              By continuing to use this website, you acknowledge and accept that it is under development and not yet fully operational.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
