import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import NotesPage from './pages/NotesPage';
import { useAdminTokenInitialization } from './hooks/useAdminTokenInitialization';

const queryClient = new QueryClient();

function AppContent() {
  // Initialize admin token for anonymous sessions
  useAdminTokenInitialization();

  return (
    <div className="min-h-screen bg-background">
      <NotesPage />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
