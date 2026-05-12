import { useDeferredValue, useState } from 'react'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'
import { PostCard } from '../components/posts/PostCard'
import { getErrorMessage } from '../features/posts/post'
import { usePublishedPosts } from '../hooks/usePublishedPosts'
import type { ContentType, TypedPost } from '../types/post.types'

type HomeFilterValue = 'date' | ContentType

function HomeFeedSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          className="animate-pulse rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5"
          key={item}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-6 w-24 rounded-full bg-stone-200" />
            <div className="h-4 w-20 rounded-full bg-stone-200" />
          </div>
          <div className="mt-5 h-44 rounded-[1.5rem] bg-stone-200" />
          <div className="mt-5 space-y-3">
            <div className="h-9 w-3/4 rounded-full bg-stone-200" />
            <div className="h-4 w-full rounded-full bg-stone-200" />
            <div className="h-4 w-5/6 rounded-full bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Home() {
  const { data, error, isLoading } = usePublishedPosts()
  const [searchTerm, setSearchTerm] = useState('')
  const [postFilter, setPostFilter] = useState<HomeFilterValue>('date')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()
  const publishedPosts = data ?? []
  const filteredPosts = publishedPosts.filter((post) => {
    const matchesTitle =
      normalizedSearchTerm.length === 0 ||
      post.title.toLowerCase().includes(normalizedSearchTerm)
    const matchesFilter =
      postFilter === 'date' || post.content_type === postFilter

    return matchesTitle && matchesFilter
  })
  const hasActiveFilters =
    normalizedSearchTerm.length > 0 || postFilter !== 'date'

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="flex flex-col gap-6 border-b border-stone-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Publications recentes
              </h1>
              <p className="text-sm text-stone-500 sm:text-base">
                Sermons, audios et articles ecrits.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem] lg:min-w-[30rem] lg:max-w-2xl lg:flex-1">
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Recherche
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
                  name="post-search"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher une publication par titre"
                  type="search"
                  value={searchTerm}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Filtrer par
                </span>
                <select
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:bg-white"
                  name="post-filter"
                  onChange={(event) =>
                    setPostFilter(event.target.value as HomeFilterValue)
                  }
                  value={postFilter}
                >
                  <option value="date">Date</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="blogpost">Article</option>
                </select>
              </label>
            </div>
          </div>

          <div className="pt-6">
            {isLoading ? <HomeFeedSkeleton /> : null}

            {!isLoading && error ? (
              <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 px-5 py-6 text-sm text-stone-700">
                {getErrorMessage(
                  error,
                  'Impossible de charger les publications pour le moment.',
                )}
              </div>
            ) : null}

            {!isLoading && !error && publishedPosts.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-sm text-stone-600">
                Aucune publication publiee n&apos;est disponible pour le moment.
              </div>
            ) : null}

            {!isLoading &&
            !error &&
            publishedPosts.length > 0 &&
            filteredPosts.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-sm text-stone-600">
                {hasActiveFilters
                  ? 'Aucune publication ne correspond aux filtres selectionnes.'
                  : 'Aucune publication publiee n&apos;est disponible pour le moment.'}
              </div>
            ) : null}

            {!isLoading && !error && filteredPosts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.map((post: TypedPost) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
