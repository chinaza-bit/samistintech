'use client';
import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bold, Italic, Underline, Heading2, Image as ImageIcon } from 'lucide-react';

export default function BlogEditor({ onPublished }: { onPublished: () => void }) {
  const [title, setTitle] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  function format(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }

  async function uploadFile(file: File, folder: string, userId: string) {
    const path = `${folder}/${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  }

  async function insertImageIntoBody(file: File, userId: string) {
    const url = await uploadFile(file, 'blog-images', userId);
    format('insertImage', url);
  }

  async function handlePublish() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please log in first.');

    const bodyHtml = editorRef.current?.innerHTML.trim() || '';
    if (!title.trim() || !bodyHtml) return alert('Add a title and some content before publishing.');

    setPublishing(true);
    try {
      let coverUrl = '';
      if (coverFile) coverUrl = await uploadFile(coverFile, 'blog-covers', user.id);

      const { error } = await supabase.from('blog_posts').insert({
        author_id: user.id,
        title: title.trim(),
        cover_image_url: coverUrl || null,
        body_html: bodyHtml,
      });
      if (error) throw error;

      setTitle('');
      setCoverFile(null);
      if (editorRef.current) editorRef.current.innerHTML = '';
      onPublished();
    } catch (err: any) {
      alert(err.message || 'Could not publish.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm mb-4">
      <p className="font-semibold mb-3">Write a blog post</p>

      <input
        className="w-full border rounded-lg p-2.5 mb-2 text-lg font-semibold"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="text-xs text-gray-500 cursor-pointer mb-2 inline-block">
        📷 Cover image (optional)
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && setCoverFile(e.target.files[0])} />
      </label>
      {coverFile && (
        <img src={URL.createObjectURL(coverFile)} className="w-full h-40 object-cover rounded-lg mb-2" />
      )}

      {/* Formatting toolbar */}
      <div className="flex items-center gap-3 text-gray-500 border rounded-t-lg px-3 py-2 bg-gray-50">
        <button onClick={() => format('bold')} title="Bold"><Bold size={16} /></button>
        <button onClick={() => format('italic')} title="Italic"><Italic size={16} /></button>
        <button onClick={() => format('underline')} title="Underline"><Underline size={16} /></button>
        <button onClick={() => format('formatBlock', 'h2')} title="Heading"><Heading2 size={16} /></button>
        <label className="cursor-pointer" title="Insert image in text">
          <ImageIcon size={16} />
          <input type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              const { data: { user } } = await supabase.auth.getUser();
              if (file && user) insertImageIntoBody(file, user.id);
            }} />
        </label>
      </div>

      {/* Editable body */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="w-full border border-t-0 rounded-b-lg p-3 min-h-[160px] outline-none prose prose-sm max-w-none"
        data-placeholder="Tell your story…"
      />

      <button
        onClick={handlePublish}
        disabled={publishing}
        className="mt-3 w-full bg-brand text-white py-2 rounded-lg font-medium disabled:opacity-60"
      >
        {publishing ? 'Publishing…' : 'Publish Blog Post'}
      </button>
    </div>
  );
}
