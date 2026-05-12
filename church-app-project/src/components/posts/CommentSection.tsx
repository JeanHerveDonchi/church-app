import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getAvatarSrc } from '@/features/profile/profile'
import {
  getAuthorName,
  getErrorMessage,
  getRelativeDateLabel,
  normalizeOptionalText,
} from '@/features/posts/post'
import { useAddComment } from '@/hooks/useAddComment'
import { useComments } from '@/hooks/useComments'
import { useDeleteComment } from '@/hooks/useDeleteComment'
import { useAuth } from '@/providers/authProvider'
import type { Comment } from '@/types/post.types'

type CommentSectionProps = {
  postId: string
}

function CommentSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1].map((item) => (
        <div
          className="animate-pulse rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4"
          key={item}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-stone-200" />
            <div className="space-y-2">
              <div className="h-4 w-28 rounded-full bg-stone-200" />
              <div className="h-3 w-20 rounded-full bg-stone-200" />
            </div>
          </div>
          <div className="mt-4 h-4 w-full rounded-full bg-stone-200" />
          <div className="mt-2 h-4 w-4/5 rounded-full bg-stone-200" />
        </div>
      ))}
    </div>
  )
}

export function CommentSection({ postId }: CommentSectionProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const addComment = useAddComment()
  const deleteComment = useDeleteComment()
  const { data, error, isLoading } = useComments(postId)
  const [draft, setDraft] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  )
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null)

  const handleSubmit = async () => {
    if (!user) {
      return
    }

    const normalizedContent = normalizeOptionalText(draft)

    if (!normalizedContent) {
      setErrorMessage('Ajoutez un commentaire avant de publier.')
      return
    }

    setErrorMessage(null)
    setDraft('')

    await queryClient.cancelQueries({ queryKey: ['comments', postId] })

    const previousComments =
      queryClient.getQueryData<Comment[]>(['comments', postId]) ?? []

    const optimisticComment: Comment = {
      id: `optimistic-${Date.now()}`,
      post_id: postId,
      content: normalizedContent,
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        email: user.email ?? null,
        full_name:
          typeof user.user_metadata.full_name === 'string'
            ? user.user_metadata.full_name
            : user.email ?? null,
        avatar_url:
          typeof user.user_metadata.avatar_url === 'string'
            ? user.user_metadata.avatar_url
            : null,
      },
    }

    queryClient.setQueryData<Comment[]>(
      ['comments', postId],
      [...previousComments, optimisticComment],
    )

    try {
      await addComment.mutateAsync({
        post_id: postId,
        content: normalizedContent,
      })
    } catch (mutationError) {
      queryClient.setQueryData<Comment[]>(['comments', postId], previousComments)
      setDraft(normalizedContent)
      setErrorMessage(
        getErrorMessage(
          mutationError,
          'Impossible de publier votre commentaire pour le moment.',
        ),
      )
    }
  }

  const handleDeleteComment = async () => {
    if (!commentToDelete) {
      return
    }

    const targetComment = commentToDelete
    setDeleteErrorMessage(null)

    await queryClient.cancelQueries({ queryKey: ['comments', postId] })

    const previousComments =
      queryClient.getQueryData<Comment[]>(['comments', postId]) ?? []

    queryClient.setQueryData<Comment[]>(
      ['comments', postId],
      previousComments.filter((comment) => comment.id !== targetComment.id),
    )

    try {
      await deleteComment.mutateAsync({
        commentId: targetComment.id,
        postId,
      })
      setCommentToDelete(null)
    } catch (mutationError) {
      queryClient.setQueryData<Comment[]>(
        ['comments', postId],
        previousComments,
      )
      setDeleteErrorMessage(
        getErrorMessage(
          mutationError,
          'Impossible de supprimer votre commentaire pour le moment.',
        ),
      )
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/95 p-5 shadow-[0_18px_40px_rgba(17,17,17,0.05)] sm:p-6">
      <div className="space-y-2 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
          Commentaires
        </h2>
        <p className="text-sm text-stone-500">
          Encouragez la discussion autour de cette publication.
        </p>
      </div>

      <div className="space-y-4 pt-5">
        {isLoading ? <CommentSkeleton /> : null}

        {!isLoading && error ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
            {getErrorMessage(
              error,
              'Impossible de charger les commentaires pour le moment.',
            )}
          </div>
        ) : null}

        {!isLoading && !error && (!data || data.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-600">
            Aucun commentaire pour le moment.
          </div>
        ) : null}

        {!isLoading && !error && deleteErrorMessage ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
            {deleteErrorMessage}
          </div>
        ) : null}

        {!isLoading && !error && data && data.length > 0 ? (
          <div className="grid gap-4">
            {data.map((comment: Comment) => {
              const authorName = getAuthorName(comment.author)
              const isOwnComment =
                user?.id === comment.author?.id &&
                !comment.id.startsWith('optimistic-')

              return (
                <article
                  className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-4"
                  key={comment.id}
                >
                  <div className="flex items-start gap-3">
                    <img
                      alt={`Avatar de ${authorName}`}
                      className="h-10 w-10 rounded-full border border-stone-300 bg-stone-100 object-cover"
                      src={getAvatarSrc(comment.author?.avatar_url)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-semibold text-stone-900">
                          {authorName}
                        </p>
                        <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                          {getRelativeDateLabel(comment.created_at)}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {comment.content}
                      </p>

                      {isOwnComment ? (
                        <div className="mt-3">
                          <button
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950"
                            onClick={() => {
                              setDeleteErrorMessage(null)
                              setCommentToDelete(comment)
                            }}
                            type="button"
                          >
                            Supprimer le commentaire
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-stone-200 pt-5">
        {user ? (
          <div className="space-y-3">
            <textarea
              className="min-h-28 w-full resize-y rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ajouter un commentaire..."
              value={draft}
            />

            {errorMessage ? (
              <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-950 bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                disabled={addComment.isPending || draft.trim().length === 0}
                onClick={() => {
                  void handleSubmit()
                }}
                type="button"
              >
                {addComment.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Publication...
                  </>
                ) : (
                  'Publier le commentaire'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-600">
            Connectez-vous pour commenter
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmText="Supprimer le commentaire"
        description={
          commentToDelete
            ? 'Ce commentaire sera retire de la discussion de maniere definitive.'
            : undefined
        }
        loading={deleteComment.isPending}
        onCancel={() => {
          if (!deleteComment.isPending) {
            setCommentToDelete(null)
          }
        }}
        onConfirm={handleDeleteComment}
        open={commentToDelete !== null}
        title="Supprimer ce commentaire ?"
      />
    </section>
  )
}
