import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import LandingPage from '@/pages/landing-page';
import LoginPage from '@/pages/login-page';
import SignupPage from '@/pages/signup-page';
import OnboardingPage from '@/pages/onboarding-page';
import AppLayout from '@/components/app-layout';
import DashboardPage from '@/pages/dashboard-page';
import LibraryPage from '@/pages/library-page';
import DocumentDetailPage from '@/pages/document-detail-page';
import UploadPage from '@/pages/upload-page';
import PracticePage from '@/pages/practice-page';
import QuizSessionPage from '@/pages/quiz-session-page';
import WeaknessesPage from '@/pages/weaknesses-page';
import ProgressPage from '@/pages/progress-page';
import FlashcardsPage from '@/pages/flashcards-page';
import ProfilePage from '@/pages/profile-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<DocumentDetailPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/practice/:sessionId" element={<QuizSessionPage />} />
        <Route path="/weaknesses" element={<WeaknessesPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/flashcards/:deckId" element={<FlashcardsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
