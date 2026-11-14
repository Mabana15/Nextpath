import { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Map,
  Compass,
  Bot,
  UserCog,
  Bell,
  LogOut,
  Menu,
  X,
  CheckCheck,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { BrandLogo } from './BrandLogo';
import type { DashboardData, AppNotification } from '../types';
import { DashboardView, type WorkspaceTab } from './DashboardView';
import { SkillAnalysisView } from './SkillAnalysisView';
import { RoadmapMissionsView } from './RoadmapMissionsView';
import { CareerExplorerView } from './CareerExplorerView';
import { MentorPracticeView } from './MentorPracticeView';
import { ProfileSettingsView } from './ProfileSettingsView';

interface WorkspaceLayoutProps {
  data: DashboardData;
  onRefreshDashboard: () => Promise<void>;
  onRetakeAssessment: () => void;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analysis', label: 'Skill Galaxy & Gaps', icon: Sparkles },
  { id: 'roadmap', label: 'Roadmap & Missions', icon: Map },
  { id: 'careers', label: 'Career Simulator', icon: Compass },
  { id: 'mentor', label: 'AI Mentor & Lab', icon: Bot },
  { id: 'profile', label: 'Profile & Agents', icon: UserCog },
];

export function WorkspaceLayout({
  data,
  onRefreshDashboard,
  onRetakeAssessment,
  onLogout,
}: WorkspaceLayoutProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleMarkNotificationRead = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await apiRequest(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
      await onRefreshDashboard();
    }
    if (notif.relatedRoute === 'analysis') setActiveTab('analysis');
    else if (notif.relatedRoute === 'roadmap') setActiveTab('roadmap');
    else if (notif.relatedRoute === 'mentor') setActiveTab('mentor');
    else setActiveTab('dashboard');
    setNotifOpen(false);
  };

  const handleMarkAllRead = async () => {
    await apiRequest('/api/notifications/read-all', { method: 'POST' });
    await onRefreshDashboard();
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-white/10 bg-[#111A33]/75 backdrop-blur-xl">
        <div className="h-16 px-6 flex items-center border-b border-white/10">
          <BrandLogo size="sm" onClick={() => setActiveTab('dashboard')} />
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#8257FF] text-white'
                    : 'text-[#C5B8FF] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-2">
            <div className="text-xs font-semibold text-white truncate">{data.profile.fullName}</div>
            <div className="text-[11px] text-[#35D6FF] truncate">{data.profile.desiredCareer}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-[#111A33] border-r border-white/10 h-full flex flex-col p-4 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#C5B8FF] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeTab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                      active ? 'bg-[#8257FF] text-white' : 'text-[#C5B8FF] hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#0B1020]/85 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-[#C5B8FF] hover:bg-white/5 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-[#C5B8FF] truncate">
              SkillBridge AI <span aria-hidden="true">/</span>{' '}
              <span className="text-white font-semibold">{activeNav.label}</span>
            </div>
          </div>

          {/* Right Controls: Notification Bell + Quick Level */}
          <div className="flex items-center gap-4 shrink-0 relative">
            <span className="hidden sm:inline text-xs font-mono text-[#35D6FF] tabular-nums">
              Lvl {data.progress?.level ?? 1} · {data.progress?.totalXp ?? 0} XP
            </span>

            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              className="relative p-2.5 rounded-xl bg-[#111A33] border border-white/12 text-[#C5B8FF] hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {data.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8257FF] text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                  {data.unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-[#111A33] border border-white/15 shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Notifications ({data.unreadCount} unread)
                    </span>
                    {data.unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-[11px] text-[#35D6FF] hover:underline cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-white/8">
                    {data.notifications.length > 0 ? (
                      data.notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleMarkNotificationRead(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
                            n.isRead ? 'opacity-65' : 'bg-[#8257FF]/8'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-white">{n.title}</span>
                            {!n.isRead && (
                              <span className="text-[10px] font-medium text-[#35D6FF] shrink-0">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#C5B8FF]/80 mt-1 leading-relaxed">{n.message}</p>
                          <div className="text-[10px] text-slate-400 mt-1.5">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-[#C5B8FF]/70">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              onNavigate={setActiveTab}
              onRetakeAssessment={onRetakeAssessment}
            />
          )}
          {activeTab === 'analysis' && (
            <SkillAnalysisView data={data} onRetakeAssessment={onRetakeAssessment} />
          )}
          {activeTab === 'roadmap' && (
            <RoadmapMissionsView data={data} onRefreshDashboard={onRefreshDashboard} />
          )}
          {activeTab === 'careers' && (
            <CareerExplorerView data={data} onRefreshDashboard={onRefreshDashboard} />
          )}
          {activeTab === 'mentor' && (
            <MentorPracticeView data={data} onRefreshDashboard={onRefreshDashboard} />
          )}
          {activeTab === 'profile' && (
            <ProfileSettingsView data={data} onRefreshDashboard={onRefreshDashboard} />
          )}
        </main>
      </div>
    </div>
  );
}
