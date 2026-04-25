import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'
import { PostFeedPlaceholder } from '../components/PostFeedPlaceholder'

function Home() {
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
                  placeholder="Rechercher une publication par titre"
                  type="search"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Filtrer par
                </span>
                <select
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:bg-white"
                  defaultValue="date"
                  name="post-filter"
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
            <PostFeedPlaceholder />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
