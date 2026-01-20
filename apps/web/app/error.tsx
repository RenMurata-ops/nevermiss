'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // AbortError は無視
    if (error.name === 'AbortError') {
      return
    }
    console.error(error)
  }, [error])

  // AbortError の場合は何も表示しない
  if (error.name === 'AbortError') {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">エラーが発生しました</h2>
        <button
          onClick={() => reset()}
          className="bg-slate-900 text-white px-4 py-2 rounded-full"
        >
          再試行
        </button>
      </div>
    </div>
  )
}
