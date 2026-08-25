import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import CategoryFeed from '@/components/CategoryFeed';

export default function TechTrendsPage() {
  return (
    <>
      <Header title="Technology Trends" />
      <CategoryFeed category="tech_trends" />
      <Navbar />
    </>
  );
}
