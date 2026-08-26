import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import CategoryFeed from '@/components/CategoryFeed';

export default function ReelsPage() {
  return (
    <>
      <Header title="Short Clips" />
      <CategoryFeed category="reel" />
      <Navbar />
    </>
  );
}
