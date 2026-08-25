import { supabase } from './supabaseClient';

type NotifyType = 'like' | 'comment' | 'follow' | 'message';

/**
 * Creates a notification for `recipientId`, triggered by the currently
 * logged-in user. Silently does nothing if the recipient is the same
 * person as the actor (no "you liked your own post" notifications),
 * or if no one is logged in.
 */
export async function notify(
  recipientId: string,
  type: NotifyType,
  postId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id === recipientId) return;

  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    actor_id: user.id,
    type,
    post_id: postId || null,
  });
}
