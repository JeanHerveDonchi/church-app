import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { buildAuthPath } from '@/features/auth/auth'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/posts/PostCard'
import {
  getEditPostRoute,
  getErrorMessage,
  getUserPostsRoute,
} from '@/features/posts/post'
import { useDeletePost } from '@/hooks/useDeletePost'
import { usePosts } from '@/hooks/usePosts'
import { useRequireFullName } from '@/hooks/useRequireFullName'
import { useAuth } from '@/providers/authProvider'
import type { TypedPost } from '@/types/post.types'

function FeedSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((item) => (
        <div
          className="animate-pulse rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5"
          key={item}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-6 w-20 rounded-full bg-stone-200" />
            <div className="h-4 w-24 rounded-full bg-stone-200" />
          </div>
          <div className="mt-5 h-48 rounded-[1.5rem] bg-stone-200" />
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

function PostFeed() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { userId } = useParams<{ userId: string }>()
  const { loading: authLoading, role, user } = useAuth()
  const { dialogProps: fullNameDialogProps, requireFullName } =
    useRequireFullName()
  const activeUserId = user?.id ?? ''
  const { data, error, isLoading } = usePosts(activeUserId)
  const deletePost = useDeletePost()
  const [postToDelete, setPostToDelete] = useState<TypedPost | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  )
  const canManagePosts = role === 'admin' || role === 'super_admin'
  const loginPath = buildAuthPath(
    '/login',
    `${location.pathname}${location.search}${location.hash}`,
  )

  if (!authLoading && !user) {
    return <Navigate replace to={loginPath} />
  }

  if (!authLoading && user && (!userId || userId !== user.id)) {
    return <Navigate replace to={getUserPostsRoute(user.id)} />
  }

  const isFeedLoading = authLoading || isLoading

  const handleDeletePost = async () => {
    if (!postToDelete) {
      return
    }

    const targetPost = postToDelete
    setDeleteErrorMessage(null)

    await queryClient.cancelQueries({
      queryKey: ['posts', 'author', activeUserId],
    })

    const previousPosts =
      queryClient.getQueryData<TypedPost[]>(['posts', 'author', activeUserId]) ??
      []

    queryClient.setQueryData<TypedPost[]>(
      ['posts', 'author', activeUserId],
      previousPosts.filter((post) => post.id !== targetPost.id),
    )

    try {
      await deletePost.mutateAsync(targetPost.id)
      setPostToDelete(null)
    } catch (mutationError) {
      queryClient.setQueryData<TypedPost[]>(
        ['posts', 'author', activeUserId],
        previousPosts,
      )
      setDeleteErrorMessage(
        getErrorMessage(
          mutationError,
          'Impossible de supprimer la publication pour le moment.',
        ),
      )
    }
  }

  const handleCreatePost = async () => {
    if (!user) {
      navigate(buildAuthPath('/login', '/posts/create'))
      return
    }

    await requireFullName({
      onContinue: async () => {
        navigate('/posts/create')
      },
      title: 'Ajoutez votre nom pour publier un post',
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                  Mes publications
                </h1>
                <p className="text-sm text-stone-500 sm:text-base">
                  Retrouvez vos brouillons, contenus publies et publications
                  archivees au meme endroit.
                </p>
              </div>

              {canManagePosts ? (
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                  onClick={() => {
                    void handleCreatePost()
                  }}
                  type="button"
                >
                  Creer une nouvelle publication
                </button>
              ) : null}
            </div>
            {isFeedLoading ? <FeedSkeleton /> : null}

            {!isFeedLoading && error ? (
              <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 px-5 py-6 text-sm text-stone-700">
                {getErrorMessage(
                  error,
                  'Impossible de charger les publications pour le moment.',
                )}
              </div>
            ) : null}

            {!isFeedLoading && !error && deleteErrorMessage ? (
              <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 px-5 py-6 text-sm text-stone-700">
                {deleteErrorMessage}
              </div>
            ) : null}

            {!isFeedLoading && !error && (!data || data.length === 0) ? (
              <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-sm text-stone-600">
                Vous n&apos;avez pas encore cree de publication.
              </div>
            ) : null}

            {!isFeedLoading && !error && data && data.length > 0 ? (
              <div className="grid gap-4">
                {data.map((post: TypedPost) => (
                  <PostCard
                    actions={
                      canManagePosts ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950"
                            onClick={() => navigate(getEditPostRoute(post.id))}
                            type="button"
                          >
                            Modifier la publication
                          </button>

                          <button
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-stone-100 px-5 py-2.5 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 hover:bg-stone-200"
                            onClick={() => {
                              setDeleteErrorMessage(null)
                              setPostToDelete(post)
                            }}
                            type="button"
                          >
                            Supprimer la publication
                          </button>
                        </div>
                      ) : null
                    }
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />

      <ConfirmDialog
        {...fullNameDialogProps}
      />

      <ConfirmDialog
        confirmText="Supprimer la publication"
        description={
          postToDelete
            ? `Cette action supprimera definitivement "${postToDelete.title}" sans toucher aux autres publications.`
            : undefined
        }
        loading={deletePost.isPending}
        onCancel={() => {
          if (!deletePost.isPending) {
            setPostToDelete(null)
          }
        }}
        onConfirm={handleDeletePost}
        open={postToDelete !== null}
        title="Supprimer cette publication ?"
      />
    </div>
  )
}

export default PostFeed
