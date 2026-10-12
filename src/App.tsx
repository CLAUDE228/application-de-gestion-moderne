import React, { useState, useEffect } from 'react';
import { Header } from './frontend/components/common/Header';
import { PosModule } from './frontend/components/pos/PosModule';
import { AccountingModule } from './frontend/components/accounting/AccountingModule';
import { InventoryModule } from './frontend/components/inventory/InventoryModule';
import { AdminModule } from './frontend/components/admin/AdminModule';
import { WeeklyAnalyticsModule } from './frontend/components/analytics/WeeklyAnalyticsModule';
import { PriceDefinitionModal } from './frontend/components/pricing/PriceDefinitionModal';
import { SectorAdaptationModal } from './frontend/components/common/SectorAdaptationModal';
import { SplashScreen } from './frontend/components/splash/SplashScreen';
import { InternalMessagingModal } from './frontend/components/messaging/InternalMessagingModal';
import { NotificationDrawer } from './frontend/components/common/NotificationDrawer';
import { store } from './services/store';
import { UserRole, BusinessSector } from './types';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Shield,
  Layers,
  MessageSquare,
  Sparkles,
  Tag,
  BarChart3,
  HeartPulse,
  Building2,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  const [, setTick] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

  // Subscribe to central store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const state = store.getState();
  const currentUser = store.getCurrentUser();
  const currentSector: BusinessSector = state.config.businessSector || 'supermarche';

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<string>(() => {
    switch (currentUser.role) {
      case 'caissier':
        return 'pos_terminal';
      case 'comptable':
        return 'acct_balance';
      case 'ravitailleur':
        return 'inv_catalog';
      case 'superadmin':
        return 'admin_dashboard';
      default:
        return 'pos_terminal';
    }
  });

  // When role changes, set default tab for that role (unless in global weekly analytics)
  useEffect(() => {
    if (activeTab === 'weekly_analytics') return;

    if (currentUser.role === 'caissier' && !activeTab.startsWith('pos_')) {
      setActiveTab('pos_terminal');
    } else if (currentUser.role === 'comptable' && !activeTab.startsWith('acct_')) {
      setActiveTab('acct_balance');
    } else if (currentUser.role === 'ravitailleur' && !activeTab.startsWith('inv_')) {
      setActiveTab('inv_catalog');
    } else if (currentUser.role === 'superadmin' && !activeTab.startsWith('admin_')) {
      setActiveTab('admin_dashboard');
    }
  }, [currentUser.role]);

  // Modals state
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Unread messages count for current user
  const unreadMessagesCount = state.messages.filter(
    (m) =>
      (m.recipientRole === 'all' || m.recipientRole === currentUser.role) &&
      !m.readBy.includes(currentUser.id)
  ).length;

  return (
    <>
      {/* Opening Splash Screen Animation */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-black via-[#070e22] to-[#0c1630] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
        
        {/* Top Navigation Bar with dark gradient, gold accents & mobile drawer */}
        <Header
          onOpenMessaging={() => setIsMessagingOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenPriceDefinition={() => setIsPriceModalOpen(true)}
          onOpenSectorAdaptation={() => setIsSectorModalOpen(true)}
          unreadCount={unreadMessagesCount}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* Main Workspace Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Responsive Sector Quick Switcher & Adaptation Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0d172e] via-slate-900 to-[#1b1933] border border-blue-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">Secteur d'activité actif :</span>
                  <span className="text-xs font-extrabold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    {state.config.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentSector === 'supermarche' && 'Modèle Grande Distribution : Vente détail, codes-barres PGC, TVA 0% & 18%.'}
                  {currentSector === 'pharmacie' && 'Modèle Officine Santé : Lots, péremption FEFO, ordonnance obligatoire, TVA 0%.'}
                  {currentSector === 'btp' && 'Modèle BTP & Matériaux : Tonnes, m³, sacs 50kg, fiches techniques MPa, crédit chantier.'}
                </p>
              </div>
            </div>

            {/* Quick 1-click sector switcher buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => store.switchSector('supermarche')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  currentSector === 'supermarche'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Supermarché</span>
              </button>

              <button
                onClick={() => store.switchSector('pharmacie')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  currentSector === 'pharmacie'
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Pharmacie</span>
              </button>

              <button
                onClick={() => store.switchSector('btp')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  currentSector === 'btp'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>BTP Matériaux</span>
              </button>

              <button
                onClick={() => setIsSectorModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/40 flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer"
                title="Détails de l'adaptation du stock"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Explication</span>
              </button>
            </div>
          </div>

          {/* Role Context Notification Bar with Dark-to-Blue-to-Gold glow */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0a1226] to-[#121c38] border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-amber-400/50 shadow-md"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-white truncate">{currentUser.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-400 text-slate-950 font-mono shadow-xs">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 sm:line-clamp-none">
                  {currentUser.role === 'caissier' &&
                    'Espace Vente & Encaissements · Recherche articles, paniers, tickets de caisse et clôture.'}
                  {currentUser.role === 'comptable' &&
                    'Espace Tarification & Finances · Fixation des prix de vente, TVA, marges et bilan mensuel CAMV.'}
                  {currentUser.role === 'ravitailleur' &&
                    'Espace Catalogue & Approvisionnement · Suivi des stocks, pertes, inventaires physiques et commandes.'}
                  {currentUser.role === 'superadmin' &&
                    'Espace Direction & Supervision Générale · Cockpit temps réel, validations exceptionnelles et réglages.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {/* Quick direct price button */}
              <button
                onClick={() => setIsPriceModalOpen(true)}
                className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Où définir les prix des articles ?"
              >
                <Tag className="w-3.5 h-3.5 text-yellow-400" />
                <span className="whitespace-nowrap">Où définir les prix ?</span>
              </button>

              <button
                onClick={() => setIsMessagingOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Messagerie Django</span>
                <span className="sm:hidden">Messages</span>
                {unreadMessagesCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-mono font-bold">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* VIEW: Dedicated Weekly Analytics Graph Tab */}
          {activeTab === 'weekly_analytics' && (
            <WeeklyAnalyticsModule />
          )}

          {/* VIEW: Role-specific modules */}
          {activeTab !== 'weekly_analytics' && currentUser.role === 'caissier' && (
            <PosModule activeSubTab={activeTab as any} />
          )}

          {activeTab !== 'weekly_analytics' && currentUser.role === 'comptable' && (
            <AccountingModule activeSubTab={activeTab as any} />
          )}

          {activeTab !== 'weekly_analytics' && currentUser.role === 'ravitailleur' && (
            <InventoryModule activeSubTab={activeTab as any} />
          )}

          {activeTab !== 'weekly_analytics' && currentUser.role === 'superadmin' && (
            <AdminModule activeSubTab={activeTab as any} />
          )}

        </main>

        {/* Global Modals */}
        <InternalMessagingModal
          isOpen={isMessagingOpen}
          onClose={() => setIsMessagingOpen(false)}
        />

        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        <PriceDefinitionModal
          isOpen={isPriceModalOpen}
          onClose={() => setIsPriceModalOpen(false)}
          onNavigateToAccountingPrices={() => {
            store.switchRole('comptable');
            setActiveTab('acct_prices');
          }}
        />

        <SectorAdaptationModal
          isOpen={isSectorModalOpen}
          onClose={() => setIsSectorModalOpen(false)}
        />

        {/* Footer */}
        <footer className="bg-slate-950/80 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-2">
            <span className="text-slate-400">{state.config.name} · {state.config.taxNumber}</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Devise : FCFA · Taux TVA : {state.config.defaultVatRate}% · Services : Laravel & Django · Secteur : {currentSector.toUpperCase()}
            </span>
          </div>
        </footer>

      </div>
    </>
  );
}
