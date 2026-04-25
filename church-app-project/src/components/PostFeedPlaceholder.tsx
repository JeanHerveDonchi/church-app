const placeholderPosts = [
  {
    detail: 'Video',
    title: 'Sermon du dimanche',
  },
  {
    detail: 'Audio',
    title: 'Priere de milieu de semaine',
  },
  {
    detail: 'Article',
    title: 'Mot du pasteur',
  },
]

export function PostFeedPlaceholder() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {placeholderPosts.map((post) => (
        <article
          className="rounded-3xl border border-stone-200 bg-stone-50/85 p-5 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-950/5"
          key={post.title}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
              {post.detail}
            </span>
            <span className="text-sm text-stone-500">Recent</span>
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-stone-950">
              {post.title}
            </h3>
            <div className="space-y-2">
              <div className="h-2.5 w-full rounded-full bg-stone-200" />
              <div className="h-2.5 w-5/6 rounded-full bg-stone-200" />
              <div className="h-2.5 w-2/3 rounded-full bg-stone-200" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
