import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import StoriesBar from '@/components/StoriesBar';
import CategoryFeed from '@/components/CategoryFeed';

export default function HomePage() {
  return (
    <>
      <Header title="SamistInTech" />
      <StoriesBar />
      <CategoryFeed category="feed" />
      <Navbar />
    </>
  );
}
