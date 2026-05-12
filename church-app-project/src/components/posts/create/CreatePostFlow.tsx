import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import StepOneType from '@/components/posts/create/steps/StepOneType'
import StepThreeContent from '@/components/posts/create/steps/StepThreeContent'
import StepTwoMeta from '@/components/posts/create/steps/StepTwoMeta'
import {
  getErrorMessage,
  getUserPostsRoute,
  normalizeOptionalText,
} from '@/features/posts/post'
import { useCreatePost } from '@/hooks/useCreatePost'
import { useUpdatePost } from '@/hooks/useUpdatePost'
import { useAuth } from '@/providers/authProvider'
import type {
  ContentType,
  CreatePostPayload,
  PostStatus,
  TipTapContent,
  UpdatePostPayload,
} from '@/types/post.types'

type CreatePostStep = 1 | 2 | 3

type DraftCapablePostPayload = {
  content_type: ContentType
  title: string
  description?: string
  status: PostStatus
  media_url?: string | null
  text_content?: TipTapContent | null
}

const flowSteps: Array<{ label: string; value: CreatePostStep }> = [
  { value: 1, label: 'Type' },
  { value: 2, label: 'Détails' },
  { value: 3, label: 'Contenu' },
]

function CreatePostFlow() {
  const navigate = useNavigate()
  const { loading, role, user } = useAuth()
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const [step, setStep] = useState<CreatePostStep>(1)
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [textContent, setTextContent] = useState<TipTapContent | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  const isAuthorized = role === 'admin' || role === 'super_admin'
  const userPostsRoute = user ? getUserPostsRoute(user.id) : '/'

  useEffect(() => {
    if (!publishSuccess || !redirectPath) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setStep(1)
      setContentType(null)
      setTitle('')
      setDescription('')
      setTextContent(null)
      setMediaUrl('')
      setDraftId(null)
      setIsSaving(false)
      setIsPublishing(false)
      setSaveError(null)
      setPublishError(null)
      setPublishSuccess(null)
      setRedirectPath(null)
      navigate(redirectPath)
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, publishSuccess, redirectPath])

  const resetFlow = () => {
    setStep(1)
    setContentType(null)
    setTitle('')
    setDescription('')
    setTextContent(null)
    setMediaUrl('')
    setDraftId(null)
    setIsSaving(false)
    setIsPublishing(false)
    setSaveError(null)
    setPublishError(null)
    setPublishSuccess(null)
    setRedirectPath(null)
  }

  const buildBasePayload = (status: PostStatus): DraftCapablePostPayload | null => {
    if (!contentType) {
      return null
    }

    return {
      content_type: contentType,
      title: title.trim(),
      description: normalizeOptionalText(description),
      status,
    }
  }

  // NOTE: Shared post payload types describe finalized posts, but this flow saves
  // incomplete drafts before article or media content exists. The current service
  // already treats missing content fields as null, so we cast at the hook boundary.
  const buildMetaDraftCreatePayload = (): CreatePostPayload | null => {
    const basePayload = buildBasePayload('draft')
    return basePayload ? (basePayload as CreatePostPayload) : null
  }

  const buildContentPayload = (
    status: PostStatus,
  ): DraftCapablePostPayload | null => {
    const basePayload = buildBasePayload(status)

    if (!basePayload || !contentType) {
      return null
    }

    if (contentType === 'blogpost') {
      return {
        ...basePayload,
        text_content: textContent ?? null,
      }
    }

    return {
      ...basePayload,
      media_url: mediaUrl.trim() || null,
    }
  }

  const handleCancel = () => {
    resetFlow()
    navigate(userPostsRoute)
  }

  const handleSelectType = (nextType: ContentType) => {
    if (contentType === nextType) {
      return
    }

    // NOTE: Changing the post type after a draft exists starts a new local draft
    // because the current update service does not change content_type_id in place.
    if (draftId) {
      setDraftId(null)
    }

    setContentType(nextType)
    setTextContent(null)
    setMediaUrl('')
    setSaveError(null)
    setPublishError(null)
  }

  const handleSaveMetaDraft = async () => {
    const normalizedTitle = title.trim()
    const payload = buildMetaDraftCreatePayload()

    if (!payload || normalizedTitle.length < 3) {
      setSaveError(
        "Le titre doit contenir au moins 3 caracteres avant l'enregistrement.",
      )
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setPublishSuccess(null)

    try {
      if (draftId) {
        // NOTE: Step 2 only updates metadata so an existing step 3 draft does not
        // lose its article body or media URL when the user comes back to edit copy.
        await updatePost.mutateAsync({
          id: draftId,
          ...payload,
        } as UpdatePostPayload)
      } else {
        const createdPost = await createPost.mutateAsync(payload)
        setDraftId(createdPost.id)
      }
    } catch (error) {
      setSaveError(
        getErrorMessage(error, "Impossible d'enregistrer le brouillon."),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveContentDraft = async () => {
    const normalizedTitle = title.trim()
    const payload = buildContentPayload('draft')

    if (!payload || normalizedTitle.length < 3) {
      setSaveError(
        "Le titre doit contenir au moins 3 caracteres avant l'enregistrement.",
      )
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setPublishSuccess(null)

    try {
      if (draftId) {
        await updatePost.mutateAsync({
          id: draftId,
          ...payload,
        } as UpdatePostPayload)
      } else {
        const createdPost = await createPost.mutateAsync(
          payload as CreatePostPayload,
        )
        setDraftId(createdPost.id)
      }
    } catch (error) {
      setSaveError(
        getErrorMessage(error, "Impossible d'enregistrer le brouillon."),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    const normalizedTitle = title.trim()
    const payload = buildContentPayload('published')

    if (!payload || normalizedTitle.length < 3) {
      setPublishError(
        'Le titre doit contenir au moins 3 caracteres avant la publication.',
      )
      return
    }

    setIsPublishing(true)
    setPublishError(null)
    setPublishSuccess(null)

    try {
      if (draftId) {
        await updatePost.mutateAsync({
          id: draftId,
          ...payload,
        } as UpdatePostPayload)
      } else {
        const createdPost = await createPost.mutateAsync(
          payload as CreatePostPayload,
        )

        setDraftId(createdPost.id)

        // NOTE: The current post service only guarantees published_at on update, so
        // a first-time publish falls back to a follow-up status update when needed.
        if (!createdPost.published_at) {
          await updatePost.mutateAsync(
            {
              id: createdPost.id,
              status: 'published',
            } as UpdatePostPayload,
          )
        }
      }

      setPublishSuccess(
        'Publication publiee avec succes. Redirection vers vos publications...',
      )
      setRedirectPath(userPostsRoute)
    } catch (error) {
      setPublishError(
        getErrorMessage(error, 'Impossible de publier la publication.'),
      )
    } finally {
      setIsPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
          <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Creer une publication
              </p>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Verification de vos acces
              </h1>
              <div className="grid gap-3 pt-3">
                {[0, 1, 2].map((item) => (
                  <div
                    className="h-16 animate-pulse rounded-[1.5rem] border border-stone-200 bg-stone-50"
                    key={item}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    )
  }

  if (!user || !isAuthorized) {
    return <Navigate replace to={user ? userPostsRoute : '/'} />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <div className="space-y-4 border-b border-stone-200 pb-6">
              <div className="space-y-2">
                <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                  Creer une nouvelle publication
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-stone-500">
                  parcours en trois etapes pour créer une publication
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {flowSteps.map((flowStep) => {
                  const isActive = flowStep.value === step
                  const isComplete = flowStep.value < step

                  return (
                    <div
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'border-stone-950 bg-stone-950 text-white'
                          : isComplete
                            ? 'border-stone-300 bg-white text-stone-700'
                            : 'border-stone-200 bg-stone-50 text-stone-500'
                      }`}
                      key={flowStep.value}
                    >
                      {flowStep.value}. {flowStep.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {step === 1 ? (
              <StepOneType
                onCancel={handleCancel}
                onNext={() => {
                  if (contentType) {
                    setStep(2)
                  }
                }}
                onSelect={handleSelectType}
                selected={contentType}
              />
            ) : null}

            {step === 2 && contentType ? (
              <StepTwoMeta
                contentType={contentType}
                description={description}
                draftId={draftId}
                isSaving={isSaving}
                onBack={() => setStep(1)}
                onCancel={handleCancel}
                onDescriptionChange={setDescription}
                onNext={() => setStep(3)}
                onSaveDraft={() => {
                  void handleSaveMetaDraft()
                }}
                onTitleChange={setTitle}
                saveError={saveError}
                title={title}
              />
            ) : null}

            {step === 3 && contentType ? (
              <StepThreeContent
                contentType={contentType}
                description={description}
                draftId={draftId}
                isPublishing={isPublishing}
                isSaving={isSaving}
                mediaUrl={mediaUrl}
                onBack={() => setStep(2)}
                onMediaChange={setMediaUrl}
                onPublish={() => {
                  void handlePublish()
                }}
                publishSuccess={publishSuccess}
                onSaveDraft={() => {
                  void handleSaveContentDraft()
                }}
                onTextChange={setTextContent}
                publishError={publishError}
                saveError={saveError}
                textContent={textContent}
                title={title}
              />
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default CreatePostFlow
