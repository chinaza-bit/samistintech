'use client';

export type BlogPost = {
  id: string;
  title: string;
  cover_image_url: string | null;
  body_html: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="border rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
      {post.cover_image_url && (
        <img src={post.cover_image_url} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-1">{post.title}</h2>
        <p className="text-xs text-gray-500 mb-3">
          {post.profiles?.username || 'user'} · {new Date(post.created_at).toLocaleDateString()}
        </p>
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: post.body_html }}
        />
      </div>
    </article>
  );
}
