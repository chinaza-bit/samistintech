'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notify } from '@/lib/notify';
import { Send, MessageCircle } from 'lucide-react';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export default function Comments({ postId, authorId }: { postId: string; authorId?: string }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);

  async function loadComments() {
    const { data, count: total } = await supabase
      .from('comments')
      .select('id, content, created_at, profiles!author_id(username, avatar_url)', { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments((data as any) || []);
    setCount(total || 0);
  }

  useEffect(() => {
    // Always load the count up front so it shows before the user opens the thread.
    loadComments();
  }, [postId]);

  async function handleAdd() {
    if (!text.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please log in to comment.');

    const { error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: user.id, content: text.trim() });

    if (error) return alert(error.message);
    setText('');
    loadComments();
    if (authorId) notify(authorId, 'comment', postId);
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-gray-500 text-sm"
      >
        <MessageCircle size={16} />
        {count > 0 ? `${count} comment${count === 1 ? '' : 's'}` : 'Comment'}
      </button>

      {open && (
        <div className="mt-2 border-t pt-2 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium">{c.profiles?.username || 'user'}</span>{' '}
              <span className="text-gray-700">{c.content}</span>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-gray-400">No comments yet — say something first.</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              className="flex-1 border rounded-full px-3 py-1.5 text-sm outline-none"
              placeholder="Add a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="text-brand">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
