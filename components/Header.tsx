import NotificationBell from './NotificationBell';

export default function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur border-b z-20 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-brand">{title}</h1>
      <NotificationBell />
    </header>
  );
}
