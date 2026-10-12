import React, { useState } from 'react';
import {
  Store,
  Bell,
  MessageSquare,
  ChevronDown,
  Tag,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  Menu,
  X,
  Layers,
  HeartPulse,
  Building2,
  ShoppingCart,
} from 'lucide-react';
import { UserRole, BusinessSector } from '../../../types';
import { store } from '../../../services/store';

interface HeaderProps {
  onOpenMessaging: () => void;
  onOpenNotifications: () => void;
  onOpenPriceDefinition: () => void;
  onOpenSectorAdaptation: () => void;
  unreadCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMessaging,
  onOpenNotifications,
  onOpenPriceDefinition,
  onOpenSectorAdaptation,
  unreadCount,
  activeTab,
  onTabChange,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const state = store.getState();
  const currentUser = store.getCurrentUser();
  const currentSector: BusinessSector = state.config.businessSector || 'supermarche';

  const stockAlertsCount = state.products.filter(
    (p) => p.isActive && p.currentStock <= p.alertThreshold
  ).length;

  const pendingApprovalsCount = state.approvalRequests.filter(
    (a) => a.status === 'pending'
  ).length;

  const rolesList: { role: UserRole; title: string; subtitle: string; icon: string }[] = [
    { role: 'caissier', title: 'Fatou Ndiaye', subtitle: 'Caissière (Caisse & Ventes)', icon: '🛍️' },
    { role: 'comptable', title: 'Jean-Marc Mensah', subtitle: 'Comptable (Prix & Finances)', icon: '📊' },
    { role: 'ravitailleur', title: 'Samuel Assogba', subtitle: 'Ravitailleur (Stocks & Achats)', icon: '📦' },
    { role: 'superadmin', title: 'Amadou Diallo', subtitle: 'Super Administrateur (Global)', icon: '👑' },
  ];

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'caissier':
        return 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60';
      case 'comptable':
        return 'text-indigo-300 bg-indigo-950/60 border-indigo-700/60';
      case 'ravitailleur':
        return 'text-amber-300 bg-amber-950/60 border-amber-700/60';
      case 'superadmin':
        return 'text-purple-300 bg-purple-950/60 border-purple-700/60';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'caissier':
        return 'Caissier(e)';
      case 'comptable':
        return 'Comptable';
      case 'ravitailleur':
        return 'Ravitailleur';
      case 'superadmin':
        return 'Super Admin';
    }
  };

  const getSectorIcon = () => {
    if (currentSector === 'pharmacie') return <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />;
    if (currentSector === 'btp') return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
    return <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const getSectorBadgeText = () => {
    if (currentSector === 'pharmacie') return 'Pharmacie';
    if (currentSector === 'btp') return 'BTP / Matériaux';
    return 'Supermarché';
  };

  const handleMobileNavClick = (tab: string) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-black via-[#091124] to-[#0f172a] border-b border-slate-800 text-white shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Zone 1: Brand title & Sector Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-white to-blue-200 bg-clip-text text-transparent truncate block max-w-[150px] sm:max-w-none">
                  {state.config.name}
                </span>
                
                {/* Sector Adaptation interactive trigger badge */}
                <button
                  onClick={onOpenSectorAdaptation}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Changer de secteur (Pharmacie, BTP, Supermarché)"
                >
                  {getSectorIcon()}
                  <span>{getSectorBadgeText()}</span>
                </button>
              </div>

              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block">
                ERP, Stocks & POS Multimodèle
              </span>
            </div>
          </div>

          {/* Zone 2: Desktop Navigation Links (hidden on < lg screens) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs font-semibold text-slate-300">
            
            {/* Global Weekly Chart Tab requested by user */}
            <button
              onClick={() => onTabChange('weekly_analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'weekly_analytics'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                  : 'text-amber-300 hover:text-white hover:bg-slate-800/60 border border-amber-500/30'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Graphique CA & Ravitaillement</span>
            </button>

            {/* Quick Price Definition Link */}
            <button
              onClick={onOpenPriceDefinition}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/10 border border-yellow-500/30 transition-colors whitespace-nowrap cursor-pointer"
              title="Où définir les prix des articles ?"
            >
              <Tag className="w-3.5 h-3.5 text-yellow-400" />
              <span>Définir les Prix</span>
            </button>

            {/* Role specific desktop navigation */}
            {currentUser.role === 'caissier' && (
              <>
                <button
                  onClick={() => onTabChange('pos_terminal')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'pos_terminal' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Terminal Caisse
                </button>
                <button
                  onClick={() => onTabChange('pos_history')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'pos_history' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Historique Ventes
                </button>
                <button
                  onClick={() => onTabChange('pos_session')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'pos_session' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Session de Caisse
                </button>
              </>
            )}

            {currentUser.role === 'comptable' && (
              <>
                <button
                  onClick={() => onTabChange('acct_prices')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'acct_prices' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Prix & TVA (Fixation)
                </button>
                <button
                  onClick={() => onTabChange('acct_analytics')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'acct_analytics' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Statistiques Ventes
                </button>
                <button
                  onClick={() => onTabChange('acct_supply')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'acct_supply' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Achats & Appro
                </button>
                <button
                  onClick={() => onTabChange('acct_balance')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'acct_balance' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Bilan Mensuel
                </button>
                <button
                  onClick={() => onTabChange('acct_audit')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'acct_audit' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Contrôle & Audit
                </button>
              </>
            )}

            {currentUser.role === 'ravitailleur' && (
              <>
                <button
                  onClick={() => onTabChange('inv_catalog')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'inv_catalog' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Catalogue Articles
                </button>
                <button
                  onClick={() => onTabChange('inv_stock')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'inv_stock' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Mouvements & Pertes
                </button>
                <button
                  onClick={() => onTabChange('inv_orders')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'inv_orders' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Commandes Fournisseurs
                </button>
                <button
                  onClick={() => onTabChange('inv_audit')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'inv_audit' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Inventaire Physique
                </button>
              </>
            )}

            {currentUser.role === 'superadmin' && (
              <>
                <button
                  onClick={() => onTabChange('admin_dashboard')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'admin_dashboard' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Supervision Temps Réel
                </button>
                <button
                  onClick={() => onTabChange('admin_approvals')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'admin_approvals' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Validations ({pendingApprovalsCount})
                </button>
                <button
                  onClick={() => onTabChange('admin_users')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'admin_users' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Utilisateurs & Rôles
                </button>
                <button
                  onClick={() => onTabChange('admin_audit')}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'admin_audit' ? 'text-amber-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  Journal d'Audit
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Interactive Affordances, Role Switcher & Mobile Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Quick Sector Adaptation Button for Mobile/Tablet */}
            <button
              onClick={onOpenSectorAdaptation}
              className="lg:hidden p-2 text-amber-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Secteurs : Pharmacie, BTP, Supermarché"
            >
              <Layers className="w-4 h-4 text-amber-400" />
            </button>

            {/* Notifications Alert Icon */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Alertes & Notifications"
            >
              <Bell className="w-4 h-4" />
              {stockAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900"></span>
              )}
            </button>

            {/* Django Messaging Center button */}
            <button
              onClick={onOpenMessaging}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Messagerie Interne Django"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full ring-2 ring-slate-900 font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${getRoleBadgeStyle(
                  currentUser.role
                )}`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-white leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    {getRoleLabel(currentUser.role)}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-md">
                  <div className="px-3 py-1.5 border-b border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Changer d'Acteur (Test Rôles)
                    </span>
                  </div>
                  {rolesList.map((item) => (
                    <button
                      key={item.role}
                      onClick={() => {
                        store.switchRole(item.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs hover:bg-slate-800 transition-colors cursor-pointer ${
                        currentUser.role === item.role ? 'bg-slate-800/80 font-bold text-amber-300' : 'text-slate-200'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <div className="flex-1">
                        <div>{item.title}</div>
                        <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                      </div>
                      {currentUser.role === item.role && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  ))}
                  <div className="mt-2 pt-2 border-t border-slate-800 px-3">
                    <button
                      onClick={() => {
                        if (confirm('Réinitialiser toutes les données de test ?')) {
                          store.resetToSeed();
                          setRoleDropdownOpen(false);
                        }
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1.5 w-full py-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser les données démo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button (< lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* MOBILE EXPANDABLE NAVIGATION MENU (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/98 border-t border-slate-800 px-4 py-4 space-y-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
          
          {/* Mobile Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
            <button
              onClick={() => {
                onTabChange('weekly_analytics');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'weekly_analytics'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-900 border border-amber-500/30 text-amber-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Graphique CA</span>
            </button>

            <button
              onClick={() => {
                onOpenPriceDefinition();
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl text-xs font-bold bg-yellow-500/10 border border-yellow-500/40 text-yellow-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Tag className="w-4 h-4 text-yellow-400" />
              <span>Définir Prix</span>
            </button>
          </div>

          {/* Sector Adaptation Card on Mobile */}
          <div
            onClick={() => {
              onOpenSectorAdaptation();
              setMobileMenuOpen(false);
            }}
            className="p-3 bg-gradient-to-r from-blue-950/50 to-slate-900 border border-blue-500/30 rounded-xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">Secteur de Stock Actuel</span>
                <span className="text-[11px] text-amber-300 capitalize">{state.config.name}</span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">
              Changer
            </span>
          </div>

          {/* Role Navigation Links on Mobile */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Modules : {getRoleLabel(currentUser.role)}
            </div>

            {currentUser.role === 'caissier' && (
              <>
                <button
                  onClick={() => handleMobileNavClick('pos_terminal')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'pos_terminal' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  🛍️ Terminal Caisse
                </button>
                <button
                  onClick={() => handleMobileNavClick('pos_history')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'pos_history' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  📜 Historique Ventes & Reçus
                </button>
                <button
                  onClick={() => handleMobileNavClick('pos_session')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'pos_session' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  🔒 Session & Clôture de Caisse
                </button>
              </>
            )}

            {currentUser.role === 'comptable' && (
              <>
                <button
                  onClick={() => handleMobileNavClick('acct_prices')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'acct_prices' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  🏷️ Fixation Prix & TVA
                </button>
                <button
                  onClick={() => handleMobileNavClick('acct_analytics')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'acct_analytics' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  📊 Statistiques Ventes & Marges
                </button>
                <button
                  onClick={() => handleMobileNavClick('acct_supply')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'acct_supply' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  🚚 Analyse Achats & Ravitaillement
                </button>
                <button
                  onClick={() => handleMobileNavClick('acct_balance')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'acct_balance' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  ⚖️ Bilan Mensuel & CAMV
                </button>
                <button
                  onClick={() => handleMobileNavClick('acct_audit')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'acct_audit' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  🛡️ Contrôle & Anomalies de Caisse
                </button>
              </>
            )}

            {currentUser.role === 'ravitailleur' && (
              <>
                <button
                  onClick={() => handleMobileNavClick('inv_catalog')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'inv_catalog' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  📦 Catalogue Articles & Stocks
                </button>
                <button
                  onClick={() => handleMobileNavClick('inv_stock')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'inv_stock' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  📉 Mouvements & Pertes / Casses
                </button>
                <button
                  onClick={() => handleMobileNavClick('inv_orders')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'inv_orders' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  🚚 Commandes & Réceptions Fournisseurs
                </button>
                <button
                  onClick={() => handleMobileNavClick('inv_audit')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'inv_audit' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  📋 Inventaire Physique & Écarts
                </button>
              </>
            )}

            {currentUser.role === 'superadmin' && (
              <>
                <button
                  onClick={() => handleMobileNavClick('admin_dashboard')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'admin_dashboard' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  👑 Supervision Temps Réel
                </button>
                <button
                  onClick={() => handleMobileNavClick('admin_approvals')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'admin_approvals' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  ⚡ Validations Exceptionnelles ({pendingApprovalsCount})
                </button>
                <button
                  onClick={() => handleMobileNavClick('admin_users')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'admin_users' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  👥 Utilisateurs & Droits
                </button>
                <button
                  onClick={() => handleMobileNavClick('admin_audit')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === 'admin_audit' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  🛡️ Journal d'Audit & Sécurité
                </button>
              </>
            )}
          </div>

        </div>
      )}

    </header>
  );
};
