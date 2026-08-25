import { supabase } from './supabaseClient';

type NotifyType = 'like' | 'comment' | 'follow' | 'message' | 'story_like';

export async function notify(
  recipientId: string,
  type: NotifyType,
  postId?: string,
  storyId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id === recipientId) return;

  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    actor_id: user.id,
    type,
    post_id: postId || null,
    story_id: storyId || null,
  });
}
