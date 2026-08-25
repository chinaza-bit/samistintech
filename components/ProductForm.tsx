'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const MAX_VIDEO_SECONDS = 30 * 60; // 30 minutes

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => resolve(video.duration);
    video.src = URL.createObjectURL(file);
  });
}

export default function ProductForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleVideoSelect(file: File) {
    const duration = await getVideoDuration(file);
    if (duration > MAX_VIDEO_SECONDS) {
      alert('Product videos can be at most 30 minutes.');
      return;
    }
    setVideoFile(file);
  }

  async function uploadFile(file: File, folder: string, userId: string) {
    const path = `${folder}/${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please log in.');
    if (!title.trim()) return alert('Product title is required.');

    setSaving(true);
    try {
      let imageUrl = '';
      let videoUrl = '';
      if (imageFile) imageUrl = await uploadFile(imageFile, 'products/images', user.id);
      if (videoFile) videoUrl = await uploadFile(videoFile, 'products/videos', user.id);

      const { error } = await supabase.from('business_products').insert({
        owner_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        price: price.trim() || null,
        link_url: link.trim() || null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
      });
      if (error) throw error;

      setTitle(''); setDescription(''); setPrice(''); setLink(''); setImageFile(null); setVideoFile(null);
      onCreated();
    } catch (err: any) {
      alert(err.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm mb-4">
      <p className="font-semibold mb-3">Add a product</p>
      <input className="w-full border rounded-lg p-2.5 mb-2 text-sm" placeholder="Product name"
        value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full border rounded-lg p-2.5 mb-2 text-sm" placeholder="Description" rows={2}
        value={description} onChange={(e) => setDescription(e.target.value)} />
      <input className="w-full border rounded-lg p-2.5 mb-2 text-sm" placeholder="Price (e.g. $25)"
        value={price} onChange={(e) => setPrice(e.target.value)} />
      <input className="w-full border rounded-lg p-2.5 mb-2 text-sm" placeholder="Product / checkout link"
        value={link} onChange={(e) => setLink(e.target.value)} />

      <div className="flex items-center gap-4 text-sm mb-3">
        <label className="cursor-pointer text-gray-600">
          📷 Image
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && setImageFile(e.target.files[0])} />
        </label>
        <label className="cursor-pointer text-gray-600">
          🎥 Video (≤30 min)
          <input type="file" accept="video/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])} />
        </label>
      </div>
      {imageFile && <p className="text-xs text-gray-500 mb-2">Image: {imageFile.name}</p>}
      {videoFile && <p className="text-xs text-gray-500 mb-2">Video: {videoFile.name}</p>}

      <button onClick={handleSubmit} disabled={saving}
        className="w-full bg-brand text-white py-2 rounded-lg font-medium disabled:opacity-60">
        {saving ? 'Saving…' : 'Publish Product'}
      </button>
    </div>
  );
}
