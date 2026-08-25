'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import ProductForm from '@/components/ProductForm';
import ProductCard, { Product } from '@/components/ProductCard';

export default function BusinessPage() {
  const [accountType, setAccountType] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessLinks, setBusinessLinks] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    const { data: profile } = await supabase
      .from('profiles').select('account_type, business_name, business_links').eq('id', user.id).single();

    setAccountType(profile?.account_type || 'personal');
    setBusinessName(profile?.business_name || '');
    setBusinessLinks(profile?.business_links || '');

    const { data: myProducts } = await supabase
      .from('business_products').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setProducts(myProducts || []);
    setLoading(false);
  }

  async function saveBusinessInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles')
      .update({ business_name: businessName, business_links: businessLinks })
      .eq('id', user.id);
    alert('Business info saved.');
  }

  async function upgradeToBusiness() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ account_type: 'business' }).eq('id', user.id);
    setAccountType('business');
  }

  if (loading) return <p className="p-6 text-center text-gray-400">Loading…</p>;

  return (
    <>
      <Header title="Business Page" />
      <div className="p-4 pb-24">
        {accountType !== 'business' ? (
          <div className="border rounded-2xl p-4 bg-white text-center">
            <p className="text-gray-600 mb-3">
              This page is for business accounts — post products, details, links and videos up to 30 minutes.
            </p>
            <button onClick={upgradeToBusiness} className="bg-brand text-white px-4 py-2 rounded-lg font-medium">
              Switch to a Business account
            </button>
          </div>
        ) : (
          <>
            <div className="border rounded-2xl p-4 bg-white shadow-sm mb-4">
              <p className="font-semibold mb-2">Business details</p>
              <input className="w-full border rounded-lg p-2.5 mb-2 text-sm" placeholder="Business name"
                value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              <input className="w-full border rounded-lg p-2.5 mb-2 text-sm" placeholder="Website / storefront link"
                value={businessLinks} onChange={(e) => setBusinessLinks(e.target.value)} />
              <button onClick={saveBusinessInfo} className="text-sm text-brand font-medium">Save details</button>
            </div>

            <ProductForm onCreated={load} />

            <p className="font-semibold mb-2">Your products</p>
            {products.length === 0 && <p className="text-gray-400 text-sm">No products posted yet.</p>}
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </>
        )}
      </div>
      <Navbar />
    </>
  );
}
