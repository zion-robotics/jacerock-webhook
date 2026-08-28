import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Router from './router';
import InstallPWA from './components/ui/InstallPWA';
import HotAlert from './components/alerts/HotAlert';
import NotificationBanner from './components/alerts/NotificationBanner';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <HotAlert />
      <NotificationBanner />
      <InstallPWA />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </QueryClientProvider>
  );
}
