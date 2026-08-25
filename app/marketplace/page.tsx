import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import CategoryFeed from '@/components/CategoryFeed';

export default function MarketplacePage() {
  return (
    <>
      <Header title="Marketplace" />
      <CategoryFeed category="marketplace" />
      <Navbar />
    </>
  );
}
