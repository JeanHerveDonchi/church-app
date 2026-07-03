import { useState } from 'react'
import ArticleComposer from '@/components/posts/composer/ArticleComposer'
import AudioComposer from '@/components/posts/composer/AudioComposer'
import VideoComposer from '@/components/posts/composer/VideoComposer'
import { useAuth } from '@/providers/authProvider'

type ComposerKind = 'article' | 'video' | 'audio'

const tabs: Array<{ label: string; value: ComposerKind }> = [
  { label: 'Article', value: 'article' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
]

function PostComposer() {
  const { loading, role } = useAuth()
  const [activeTab, setActiveTab] = useState<ComposerKind>('article')

  if (loading || (role !== 'admin' && role !== 'super_admin')) {
    return null
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-5 shadow-[0_20px_50px_rgba(17,17,17,0.07)] backdrop-blur sm:p-6">
      <div className="space-y-2 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
          Creer une publication
        </h2>
        <p className="text-sm text-stone-500">
          Choisissez le format qui convient le mieux a votre contenu.
        </p>
      </div>

      <div className="pt-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value

            return (
              <button
                className={`min-h-12 rounded-full border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-stone-300 ${
                  isActive
                    ? 'border-stone-950 bg-stone-950 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300 hover:bg-white'
                }`}
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                type="button"
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          {activeTab === 'article' ? <ArticleComposer /> : null}
          {activeTab === 'video' ? <VideoComposer /> : null}
          {activeTab === 'audio' ? <AudioComposer /> : null}
        </div>
      </div>
    </section>
  )
}

export default PostComposer
