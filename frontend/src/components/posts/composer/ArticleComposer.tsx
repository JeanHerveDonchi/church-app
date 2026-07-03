import { useState } from 'react'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import { ComposerStatusToggle } from '@/components/posts/composer/ComposerStatusToggle'
import {
  getErrorMessage,
  normalizeOptionalText,
} from '@/features/posts/post'
import { useCreatePost } from '@/hooks/useCreatePost'
import type {
  CreateArticlePostPayload,
  TipTapContent,
} from '@/types/post.types'

type ToolbarButtonProps = {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}

function ToolbarButton({
  active = false,
  disabled = false,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      className={`rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-stone-300 ${
        active
          ? 'border-stone-950 bg-stone-950 text-white'
          : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300 hover:bg-white'
      } disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function ArticleComposer() {
  const createPost = useCreatePost()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Redigez votre article ici...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'min-h-[16rem] outline-none text-base leading-7 text-stone-700',
      },
    },
  })

  const isBodyEmpty = !editor || editor.getText().trim().length === 0
  const isSubmitDisabled =
    createPost.isPending || title.trim().length === 0 || isBodyEmpty

  const toggleLink = () => {
    if (!editor) {
      return
    }

    const currentHref = editor.getAttributes('link').href
    const nextHref = window.prompt(
      'Ajoutez une URL',
      typeof currentHref === 'string' ? currentHref : 'https://',
    )

    if (nextHref === null) {
      return
    }

    const normalizedHref = nextHref.trim()

    if (!normalizedHref) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: normalizedHref })
      .run()
  }

  const handleSubmit = async () => {
    const normalizedTitle = title.trim()

    if (!editor || !normalizedTitle) {
      setErrorMessage("Ajoutez d'abord un titre a votre article.")
      return
    }

    if (editor.getText().trim().length === 0) {
      setErrorMessage("Le corps de l'article ne peut pas etre vide.")
      return
    }

    setErrorMessage(null)

    const payload: CreateArticlePostPayload = {
      content_type: 'blogpost',
      title: normalizedTitle,
      description: normalizeOptionalText(description),
      text_content: editor.getJSON() as TipTapContent,
      status,
    }

    try {
      await createPost.mutateAsync(payload)
      setTitle('')
      setDescription('')
      setStatus('draft')
      editor.commands.clearContent(true)
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible d'enregistrer cet article pour le moment.",
        ),
      )
    }
  }

  return (
    <div className="space-y-5">
      <input
        className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 font-serif text-3xl font-semibold tracking-tight text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white sm:text-4xl"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Titre de l'article"
        type="text"
        value={title}
      />

      <textarea
        className="min-h-28 w-full resize-y rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description courte pour introduire l'article."
        value={description}
      />

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Mise en forme
        </p>

        <div className="flex flex-wrap gap-2">
          <ToolbarButton
            active={editor?.isActive('bold')}
            disabled={!editor}
            label="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            active={editor?.isActive('italic')}
            disabled={!editor}
            label="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            active={editor?.isActive('underline')}
            disabled={!editor}
            label="Underline"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            active={editor?.isActive('heading', { level: 2 })}
            disabled={!editor}
            label="H2"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          />
          <ToolbarButton
            active={editor?.isActive('heading', { level: 3 })}
            disabled={!editor}
            label="H3"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          />
          <ToolbarButton
            active={editor?.isActive('bulletList')}
            disabled={!editor}
            label="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            active={editor?.isActive('orderedList')}
            disabled={!editor}
            label="Ordered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            active={editor?.isActive('blockquote')}
            disabled={!editor}
            label="Blockquote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            active={editor?.isActive('link')}
            disabled={!editor}
            label="Link"
            onClick={toggleLink}
          />
          <ToolbarButton
            disabled={!editor || !editor.can().undo()}
            label="Undo"
            onClick={() => editor?.chain().focus().undo().run()}
          />
          <ToolbarButton
            disabled={!editor || !editor.can().redo()}
            label="Redo"
            onClick={() => editor?.chain().focus().redo().run()}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Contenu
        </p>

        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_16px_30px_rgba(17,17,17,0.04)] [&_.ProseMirror]:min-h-[16rem] [&_.ProseMirror]:outline-none [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-stone-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:text-2xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-stone-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]">
          <EditorContent editor={editor} />
        </div>
      </div>

      <ComposerStatusToggle onChange={setStatus} value={status} />

      {errorMessage ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">
          Les permissions finales restent controlees par Supabase.
        </p>

        <button
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-950 bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          disabled={isSubmitDisabled}
          onClick={() => {
            void handleSubmit()
          }}
          type="button"
        >
          {createPost.isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Publication...
            </>
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </div>
  )
}

export default ArticleComposer
