import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import ArticleContent from '@/components/posts/create/content/ArticleContent'
import AudioContent from '@/components/posts/create/content/AudioContent'
import VideoContent from '@/components/posts/create/content/VideoContent'
import {
  getErrorMessage,
  getPostStatusLabel,
  getPostTypeLabel,
  getUserPostsRoute,
  isValidSoundCloudUrl,
  isValidYouTubeUrl,
  normalizeOptionalText,
} from '@/features/posts/post'
import { usePost } from '@/hooks/usePost'
import { useUpdatePost } from '@/hooks/useUpdatePost'
import { useAuth } from '@/providers/authProvider'
import {
  isArticlePost,
  isAudioPost,
  isVideoPost,
  type TipTapContent,
  type TypedPost,
  type UpdatePostPayload,
} from '@/types/post.types'

function EditPostSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((item) => (
        <div
          className="h-24 animate-pulse rounded-[1.75rem] border border-stone-200 bg-stone-50"
          key={item}
        />
      ))}
    </div>
  )
}

type EditPostFormProps = {
  post: TypedPost
  userPostsRoute: string
}

function EditPostForm({ post, userPostsRoute }: EditPostFormProps) {
  const navigate = useNavigate()
  const updatePost = useUpdatePost()
  const [title, setTitle] = useState(post.title)
  const [description, setDescription] = useState(post.description ?? '')
  const [textContent, setTextContent] = useState<TipTapContent | null>(
    isArticlePost(post) ? post.text_content : null,
  )
  const [mediaUrl, setMediaUrl] = useState(
    isArticlePost(post) ? '' : post.media_url,
  )
  const [isMediaValid, setIsMediaValid] = useState(
    isArticlePost(post)
      ? true
      : isVideoPost(post)
        ? isValidYouTubeUrl(post.media_url)
        : isValidSoundCloudUrl(post.media_url),
  )
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const normalizedTitle = title.trim()

    if (normalizedTitle.length < 3) {
      setFormError('Le titre doit contenir au moins 3 caracteres.')
      return
    }

    const payload: UpdatePostPayload = {
      id: post.id,
      title: normalizedTitle,
      description: normalizeOptionalText(description),
    }

    if (isArticlePost(post)) {
      payload.text_content = textContent ?? post.text_content
    } else {
      const normalizedMediaUrl = mediaUrl.trim()

      if (!normalizedMediaUrl || !isMediaValid) {
        setFormError(
          isVideoPost(post)
            ? "Ajoutez une URL YouTube valide avant d'enregistrer."
            : "Ajoutez une URL SoundCloud valide avant d'enregistrer.",
        )
        return
      }

      payload.media_url = normalizedMediaUrl
    }

    setFormError(null)

    try {
      await updatePost.mutateAsync(payload)
      navigate(userPostsRoute)
    } catch (mutationError) {
      setFormError(
        getErrorMessage(
          mutationError,
          'Impossible de mettre a jour la publication pour le moment.',
        ),
      )
    }
  }

  return (
    <>
      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
            {getPostTypeLabel(post.content_type)}
          </span>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            {getPostStatusLabel(post.status)}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Modifier la publication
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Ajustez votre contenu sans toucher aux commentaires deja publies.
          </h1>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Titre
          </span>
          <input
            className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 font-serif text-2xl font-semibold tracking-tight text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white sm:text-3xl"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre de la publication"
            type="text"
            value={title}
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Description
          </span>
          <textarea
            className="min-h-28 w-full resize-y rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ajoutez un contexte ou une invitation."
            rows={4}
            value={description}
          />
        </label>
      </div>

      {isArticlePost(post) ? (
        <ArticleContent
          onChange={setTextContent}
          value={textContent ?? post.text_content}
        />
      ) : null}

      {isVideoPost(post) ? (
        <VideoContent
          onChange={setMediaUrl}
          onValidationChange={setIsMediaValid}
          value={mediaUrl}
        />
      ) : null}

      {isAudioPost(post) ? (
        <AudioContent
          onChange={setMediaUrl}
          onValidationChange={setIsMediaValid}
          value={mediaUrl}
        />
      ) : null}

      {formError ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          {formError}
        </p>
      ) : null}

      <div className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_16px_35px_rgba(17,17,17,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-stone-500">
            Les commentaires existants restent attaches a cette publication.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={updatePost.isPending}
              onClick={() => navigate(userPostsRoute)}
              type="button"
            >
              Annuler
            </button>

            <button
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
              disabled={updatePost.isPending}
              onClick={() => {
                void handleSubmit()
              }}
              type="button"
            >
              {updatePost.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function EditPost() {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const { loading: authLoading, role, user } = useAuth()
  const { data: post, error, isLoading } = usePost(postId ?? '')
  const isAuthorized = role === 'admin' || role === 'super_admin'
  const userPostsRoute = user ? getUserPostsRoute(user.id) : '/'

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
          <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Modifier une publication
                </p>
                <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                  Verification de vos acces
                </h1>
              </div>

              <EditPostSkeleton />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    )
  }

  if (!user || !isAuthorized) {
    return <Navigate replace to={userPostsRoute} />
  }

  if (!isLoading && post && post.author?.id !== user.id) {
    return <Navigate replace to={userPostsRoute} />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <button
              className="w-fit text-sm font-medium text-stone-600 transition hover:text-stone-950"
              onClick={() => navigate(userPostsRoute)}
              type="button"
            >
              Retour a mes publications
            </button>

            {isLoading ? <EditPostSkeleton /> : null}

            {!isLoading && (!postId || error || !post) ? (
              <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 px-5 py-6 text-sm text-stone-700">
                {getErrorMessage(
                  error,
                  'Cette publication est introuvable ou indisponible.',
                )}
              </div>
            ) : null}

            {!isLoading && post ? (
              <>
                <EditPostForm key={post.id} post={post} userPostsRoute={userPostsRoute} />
              </>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default EditPost
