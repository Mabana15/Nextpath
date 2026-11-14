import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiRequest, clearStoredToken, getStoredToken } from './lib/api';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { SkillAssessmentPage } from './components/SkillAssessmentPage';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import type { DashboardData, User } from './types';

type AppScreen = 'booting' | 'landing' | 'auth' | 'onboarding' | 'assessment' | 'workspace';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('booting');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [forceNewAssessment, setForceNewAssessment] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const data = await apiRequest<DashboardData>('/api/dashboard');
    setDashboardData(data);
  }, []);

  const routeAuthenticatedUser = useCallback(
    async (onboardingCompleted: boolean, hasCompletedAssessment: boolean) => {
      if (!onboardingCompleted) {
        setScreen('onboarding');
        return;
      }
      if (!hasCompletedAssessment) {
        setForceNewAssessment(false);
        setScreen('assessment');
        return;
      }
      await loadDashboard();
      setScreen('workspace');
    },
    [loadDashboard]
  );

  useEffect(() => {
    (async () => {
      const token = getStoredToken();
      if (!token) {
        setScreen('landing');
        return;
      }
      try {
        const me = await apiRequest<{
          user: User;
          onboardingCompleted: boolean;
          hasCompletedAssessment: boolean;
        }>('/api/auth/me');
        await routeAuthenticatedUser(me.onboardingCompleted, me.hasCompletedAssessment);
      } catch {
        clearStoredToken();
        setScreen('landing');
      }
    })();
  }, [routeAuthenticatedUser]);

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network error on logout
    }
    clearStoredToken();
    setDashboardData(null);
    setScreen('landing');
  };

  if (screen === 'booting') {
    return (
      <div className="min-h-screen bg-[#0B1020] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-[#35D6FF] animate-spin" />
        <p className="text-xs text-[#C5B8FF]">Restoring your SkillBridge AI session...</p>
      </div>
    );
  }

  if (screen === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => {
          setAuthInitialMode('register');
          setScreen('auth');
        }}
        onLogin={() => {
          setAuthInitialMode('login');
          setScreen('auth');
        }}
      />
    );
  }

  if (screen === 'auth') {
    return (
      <AuthPage
        initialMode={authInitialMode}
        onBackToLanding={() => setScreen('landing')}
        onAuthSuccess={async (res) => {
          setBootError(null);
          try {
            await routeAuthenticatedUser(res.onboardingCompleted, res.hasCompletedAssessment);
          } catch (err) {
            setBootError(err instanceof Error ? err.message : 'Unable to load workspace.');
          }
        }}
      />
    );
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={() => {
          setForceNewAssessment(false);
          setScreen('assessment');
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'assessment') {
    return (
      <SkillAssessmentPage
        forceNew={forceNewAssessment}
        onFinishedToDashboard={async () => {
          await loadDashboard();
          setScreen('workspace');
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'workspace' && dashboardData) {
    return (
      <WorkspaceLayout
        data={dashboardData}
        onRefreshDashboard={loadDashboard}
        onRetakeAssessment={() => {
          setForceNewAssessment(true);
          setScreen('assessment');
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-red-300">{bootError || 'Loading workspace...'}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="px-4 py-2 rounded-xl bg-[#8257FF] text-white text-xs font-semibold cursor-pointer"
      >
        Return to Home
      </button>
    </div>
  );
}
