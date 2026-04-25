import BottomNav from '@/components/BottomNav';
import ChatFab from '@/components/ChatFab';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1 flex flex-col pb-[72px]">{children}</div>
      <ChatFab />
      <BottomNav />
    </>
  );
}
