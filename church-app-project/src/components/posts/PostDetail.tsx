import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import { generateHTML } from '@tiptap/core'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { CommentSection } from '@/components/posts/CommentSection'
import { getAvatarSrc } from '@/features/profile/profile'
import {
  getAuthorName,
  getErrorMessage,
  getPostDateLabel,
  getUserPostsRoute,
  getPostTypeLabel,
  getSoundCloudEmbedUrl,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from '@/features/posts/post'
import { usePost } from '@/hooks/usePost'
import { useAuth } from '@/providers/authProvider'
import {
  isArticlePost,
  isAudioPost,
  isVideoPost,
} from '@/types/post.types'

function DetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-24 rounded-full bg-stone-200" />
      <div className="h-12 w-4/5 rounded-[1.5rem] bg-stone-200" />
      <div className="h-5 w-2/3 rounded-full bg-stone-200" />
      <div className="h-72 rounded-[1.75rem] bg-stone-200" />
    </div>
  )
}

function PostDetail() {
  const { postId } = useParams<{ postId: string }>()
  const { user } = useAuth()
  const { data: post, error, isLoading } = usePost(postId ?? '')
  const backRoute = post?.author?.id
    ? getUserPostsRoute(post.author.id)
    : user
      ? getUserPostsRoute(user.id)
      : '/'

  const articleHtml =
    post && isArticlePost(post)
      ? generateHTML(post.text_content, [
          StarterKit.configure({
            heading: {
              levels: [2, 3],
            },
          }),
          Underline,
          Link,
          Image,
        ])
      : ''

  const videoId = post && isVideoPost(post) ? getYouTubeVideoId(post.media_url) : null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <RouterLink
              className="text-sm font-medium text-stone-600 transition hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-stone-300"
              to={backRoute}
            >
              Retour a mes publications
            </RouterLink>

            {isLoading ? <DetailSkeleton /> : null}

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
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
                      {getPostTypeLabel(post.content_type)}
                    </span>
                    <span className="text-sm text-stone-500">
                      {getPostDateLabel(post)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                      {post.title}
                    </h1>
                    {post.description ? (
                      <p className="text-base leading-7 text-stone-600">
                        {post.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      alt={`Avatar de ${getAuthorName(post.author)}`}
                      className="h-12 w-12 rounded-full border border-stone-300 bg-stone-100 object-cover"
                      src={getAvatarSrc(post.author?.avatar_url)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        {getAuthorName(post.author)}
                      </p>
                      <p className="text-sm text-stone-500">Auteur</p>
                    </div>
                  </div>
                </div>

                {isVideoPost(post) ? (
                  <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100 shadow-[0_18px_40px_rgba(17,17,17,0.06)]">
                    {videoId ? (
                      <div className="aspect-video">
                        <iframe
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="h-full w-full"
                          src={getYouTubeEmbedUrl(videoId)}
                          title={post.title}
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-56 items-center justify-center px-6 text-center text-sm text-stone-600">
                        Cette video ne contient pas une URL YouTube exploitable.
                      </div>
                    )}
                  </div>
                ) : null}

                {isAudioPost(post) ? (
                  <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100 shadow-[0_18px_40px_rgba(17,17,17,0.06)]">
                    <iframe
                      allow="autoplay"
                      className="h-[28rem] w-full"
                      src={getSoundCloudEmbedUrl(post.media_url)}
                      title={post.title}
                    />
                  </div>
                ) : null}

                {isArticlePost(post) ? (
                  <article
                    className="rounded-[1.75rem] border border-stone-200 bg-white px-5 py-6 text-[15px] leading-8 text-stone-700 shadow-[0_18px_40px_rgba(17,17,17,0.05)] [&_a]:font-medium [&_a]:text-stone-950 [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-semibold [&_img]:w-full [&_img]:rounded-[1.5rem] [&_img]:border [&_img]:border-stone-200 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 sm:px-7 sm:py-8"
                    dangerouslySetInnerHTML={{ __html: articleHtml }}
                  />
                ) : null}

                <CommentSection postId={post.id} />
              </>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default PostDetail
