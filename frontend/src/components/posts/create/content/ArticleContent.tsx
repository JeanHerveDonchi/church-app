import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import type { TipTapContent } from '@/types/post.types'

type ArticleContentProps = {
  value: TipTapContent | null
  onChange: (val: TipTapContent) => void
}

type ToolbarButtonProps = {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}

const EMPTY_ARTICLE_CONTENT: TipTapContent = {
  type: 'doc',
  content: [],
}

function ToolbarButton({
  active = false,
  disabled = false,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      className={`shrink-0 rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-stone-300 ${
        active
          ? 'border-stone-950 bg-stone-950 text-white'
          : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50'
      } disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function ToolbarSeparator() {
  return <span className="h-8 w-px shrink-0 bg-stone-200" aria-hidden="true" />
}

function ArticleContent({ value, onChange }: ArticleContentProps) {
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
      Placeholder.configure({
        placeholder: 'Commencez a rediger votre publication...',
      }),
    ],
    content: value ?? EMPTY_ARTICLE_CONTENT,
    editorProps: {
      attributes: {
        class:
          'min-h-[300px] text-base leading-7 text-stone-700 outline-none sm:min-h-[400px]',
      },
    },
    onUpdate({ editor: nextEditor }) {
      onChange(nextEditor.getJSON() as TipTapContent)
    },
  })

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_18px_40px_rgba(17,17,17,0.05)]">
      <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex w-max items-center gap-2 px-1">
            <ToolbarButton
              active={editor?.isActive('bold')}
              disabled={!editor}
              label="Gras"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              active={editor?.isActive('italic')}
              disabled={!editor}
              label="Italique"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              active={editor?.isActive('underline')}
              disabled={!editor}
              label="Souligne"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            />
            <ToolbarSeparator />
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
            <ToolbarSeparator />
            <ToolbarButton
              active={editor?.isActive('bulletList')}
              disabled={!editor}
              label="Liste a puces"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              active={editor?.isActive('orderedList')}
              disabled={!editor}
              label="Liste numerotee"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            />
            <ToolbarButton
              active={editor?.isActive('blockquote')}
              disabled={!editor}
              label="Citation"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarSeparator />
            <ToolbarButton
              disabled={!editor || !editor.can().undo()}
              label="Annuler"
              onClick={() => editor?.chain().focus().undo().run()}
            />
            <ToolbarButton
              disabled={!editor || !editor.can().redo()}
              label="Retablir"
              onClick={() => editor?.chain().focus().redo().run()}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5">
        <div className="[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-stone-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:text-2xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-stone-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

export default ArticleContent
