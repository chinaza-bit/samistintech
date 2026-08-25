import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import CategoryFeed from '@/components/CategoryFeed';

export default function BusinessTrendsPage() {
  return (
    <>
      <Header title="Business Trends" />
      <CategoryFeed category="business_trends" />
      <Navbar />
    </>
  );
}
