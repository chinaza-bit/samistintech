'use client';

export type Product = {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  link_url: string | null;
  image_url: string | null;
  video_url: string | null;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded-2xl overflow-hidden shadow-sm mb-4 bg-white">
      {product.image_url && <img src={product.image_url} className="w-full h-44 object-cover" />}
      {product.video_url && <video src={product.video_url} controls className="w-full h-44 object-cover" />}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{product.title}</p>
          {product.price && <span className="text-brand font-medium text-sm">{product.price}</span>}
        </div>
        {product.description && <p className="text-sm text-gray-600 mt-1">{product.description}</p>}
        {product.link_url && (
          <a href={product.link_url} target="_blank" className="text-brand text-sm mt-2 block truncate">
            {product.link_url}
          </a>
        )}
      </div>
    </div>
  );
}
