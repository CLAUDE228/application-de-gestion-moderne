import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Sliders,
  RotateCcw,
  Store,
  Layers,
  Activity,
  Tag,
} from 'lucide-react';
import { UserRole, SupermarketConfig, ApprovalRequest } from '../../../types';
import { store, formatFCFA } from '../../../services/store';

interface AdminModuleProps {
  activeSubTab?: 'admin_dashboard' | 'admin_approvals' | 'admin_users' | 'admin_audit' | 'admin_config';
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  activeSubTab = 'admin_dashboard',
}) => {
  const state = store.getState();
  const currentUser = store.getCurrentUser();

  // Period filter
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('today');

  // Config editing
  const [configForm, setConfigForm] = useState<SupermarketConfig>(state.config);

  // Approval review note
  const [approvalNote, setApprovalNote] = useState('');

  // Daily Sales Calculation
  const salesToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return state.sales.filter((s) => s.type === 'definitive' && s.date.startsWith(todayStr) && s.status === 'completed');
  }, [state.sales]);

  const itemsSoldTodayCount = useMemo(() => {
    return salesToday.reduce((acc, s) => {
      return acc + s.items.reduce((sum, it) => sum + it.quantity, 0);
    }, 0);
  }, [salesToday]);

  const revenueTodayFCFA = useMemo(() => {
    return salesToday.reduce((acc, s) => acc + s.totalAmount, 0);
  }, [salesToday]);

  // Stock counts
  const totalStockQuantity = useMemo(() => {
    return state.products.filter((p) => p.isActive).reduce((acc, p) => acc + p.currentStock, 0);
  }, [state.products]);

  const stockAlerts = useMemo(() => {
    return state.products.filter((p) => p.isActive && p.currentStock <= p.alertThreshold);
  }, [state.products]);

  // Restocked items today
  const restockedToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return state.stockMovements.filter(
      (m) => m.type === 'reception' && m.date.startsWith(todayStr)
    );
  }, [state.stockMovements]);

  const restockedItemsCountToday = useMemo(() => {
    return restockedToday.reduce((acc, m) => acc + m.quantityChange, 0);
  }, [restockedToday]);

  // Pending Proformas
  const pendingProformas = useMemo(() => {
    return state.sales.filter((s) => s.type === 'proforma' && s.status === 'completed');
  }, [state.sales]);

  // Pending Approvals
  const pendingApprovals = useMemo(() => {
    return state.approvalRequests.filter((a) => a.status === 'pending');
  }, [state.approvalRequests]);

  // Open vs Closed Cash Registers
  const openCashSessions = useMemo(() => {
    return state.cashSessions.filter((s) => s.status === 'open');
  }, [state.cashSessions]);

  // Handle Approval Action
  const handleApprovalAction = (requestId: string, approve: boolean) => {
    store.resolveApprovalRequest(requestId, approve, approvalNote);
    setApprovalNote('');
  };

  // Handle Save Config
  const handleSaveConfig = () => {
    store.updateConfig(configForm);
    alert('Paramètres du supermarché mis à jour.');
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* SUB-TAB 1: SUPERVISION EN TEMPS RÉEL (LE TABLEAU DE BORD OFFICIEL) */}
      {activeSubTab === 'admin_dashboard' && (
        <div className="space-y-6">
          
          {/* Top Bar with Period Filter */}
          <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Cockpit Exécutif de Supervision
              </h2>
              <p className="text-xs text-slate-400">
                Surveillance centralisée des encaissements, des stocks et des opérations en direct.
              </p>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setPeriodFilter('today')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  periodFilter === 'today' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setPeriodFilter('week')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  periodFilter === 'week' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cette Semaine
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  periodFilter === 'month' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ce Mois
              </button>
            </div>
          </div>

          {/* THE 4 MANDATORY CARDS FROM USER SPECIFICATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Articles vendus aujourd'hui */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Articles Vendus Aujourd'hui
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black font-mono text-white">
                  {itemsSoldTodayCount} unités
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                  Mise à jour à chaque vente validée
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 font-mono">
                {salesToday.length} transactions caisse
              </div>
            </div>

            {/* Card 2: Chiffre d'affaires du jour en FCFA */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chiffre d'Affaires du Jour
                </span>
                <span className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/60">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black font-mono text-amber-400">
                  {formatFCFA(revenueTodayFCFA)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Encaissé en devises FCFA
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 font-mono">
                Moyenne : {salesToday.length > 0 ? formatFCFA(revenueTodayFCFA / salesToday.length) : '0 FCFA'}
              </div>
            </div>

            {/* Card 3: Articles disponibles & Quantités en stock */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Articles Disponibles en Stock
                </span>
                <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black font-mono text-cyan-300">
                  {totalStockQuantity} unités
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Réparties sur {state.products.length} références
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 font-mono">
                Valeur : {formatFCFA(state.products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0))}
              </div>
            </div>

            {/* Card 4: Alertes de stock */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Alertes de Stock Critique
                </span>
                <span className="p-1.5 rounded-lg bg-red-950 text-red-400 border border-red-800/60">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black font-mono text-red-400">
                  {stockAlerts.length} articles
                </div>
                <div className="text-[11px] text-red-400 mt-1 font-medium">
                  Seuil atteint ou stock épuisé
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 font-mono">
                Ravitailleur notifié automatiquement
              </div>
            </div>

          </div>

          {/* SECONDARY ROW: REAL-TIME OPERATIONAL METRICS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cash Registers Status */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
              <h3 className="font-bold text-xs uppercase text-slate-400 flex items-center justify-between">
                <span>Caisses Ouvertes & Sessions</span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {openCashSessions.length} active(s)
                </span>
              </h3>

              <div className="space-y-2.5 pt-1 text-xs">
                {state.cashSessions.slice(0, 3).map((sess) => (
                  <div key={sess.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{sess.registerNumber}</div>
                      <div className="text-[11px] text-slate-400">{sess.cashierName} · {new Date(sess.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">{formatFCFA(sess.totalSalesAmount)}</div>
                      <span className={`text-[10px] font-semibold ${sess.status === 'open' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {sess.status === 'open' ? '● En cours' : 'Clôturée'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restocking Today & Receptions */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
              <h3 className="font-bold text-xs uppercase text-slate-400 flex items-center justify-between">
                <span>Ravitaillement du Jour</span>
                <span className="font-mono text-cyan-400 text-xs font-bold">{restockedItemsCountToday} unités</span>
              </h3>

              <div className="space-y-2.5 pt-1 text-xs">
                {restockedToday.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{m.productName}</div>
                      <div className="text-[11px] text-slate-400">Par {m.userName} ({m.userRole})</div>
                    </div>
                    <div className="font-mono font-bold text-emerald-400">
                      +{m.quantityChange} unités
                    </div>
                  </div>
                ))}

                {restockedToday.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Aucune livraison réceptionnée aujourd'hui
                  </div>
                )}
              </div>
            </div>

            {/* Pending Proformas */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
              <h3 className="font-bold text-xs uppercase text-slate-400 flex items-center justify-between">
                <span>Factures Proforma en Attente</span>
                <span className="font-mono text-amber-400 text-xs font-bold">{pendingProformas.length} devis</span>
              </h3>

              <div className="space-y-2.5 pt-1 text-xs">
                {pendingProformas.map((pro) => (
                  <div key={pro.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-white">{pro.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">{pro.customerName || 'Client'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">{formatFCFA(pro.totalAmount)}</div>
                      <span className="text-[10px] text-yellow-400 font-medium">En attente confirmation</span>
                    </div>
                  </div>
                ))}

                {pendingProformas.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Aucune proforma en cours
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* STOCK ALERTS DETAILED LIST */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-red-950/60 border-b border-red-900/60 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-200">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  Détail des Articles Sous Seuil ou en Rupture de Stock
                </h3>
              </div>
              <span className="text-xs font-bold text-red-400 font-mono">
                {stockAlerts.length} alertes actives
              </span>
            </div>

            <div className="divide-y divide-slate-800 text-xs">
              {stockAlerts.map((prod) => (
                <div key={prod.id} className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                  <div>
                    <span className="font-semibold text-white text-sm">{prod.name}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Réf : <span className="font-mono text-slate-300">{prod.reference}</span> · Rayon : {prod.category} · Lot : <span className="font-mono text-slate-300">{prod.lotNumber}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-red-400">
                      Stock : {prod.currentStock} {prod.unit}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Seuil d'alerte : {prod.alertThreshold} {prod.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: DEMANDES DE VALIDATION & AUTORISATIONS */}
      {activeSubTab === 'admin_approvals' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm text-white">
              Demandes d'Autorisations Exceptionnelles
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Traitez les annulations de vente, les remises VIP ou les régularisations de caisse soumises par les caissiers ou le comptable.
            </p>
          </div>

          <div className="space-y-4">
            {state.approvalRequests.map((req) => (
              <div
                key={req.id}
                className={`bg-slate-900/90 p-5 rounded-xl border shadow-xl space-y-3 ${
                  req.status === 'pending'
                    ? 'border-amber-500/60'
                    : req.status === 'approved'
                    ? 'border-emerald-500/60'
                    : 'border-slate-800 opacity-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-slate-400">
                      Demande N° {req.id} · {req.type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-0.5">
                      {req.targetLabel}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Initié par : <strong className="text-amber-400">{req.requesterName}</strong> ({req.requesterRole}) à{' '}
                      {new Date(req.createdAt).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      req.status === 'pending'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : req.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {req.status === 'pending'
                      ? 'En Attente de Votre Accord'
                      : req.status === 'approved'
                      ? 'Approuvée'
                      : 'Rejetée'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg text-xs text-slate-300 border border-slate-800">
                  <strong>Motif fourni :</strong> {req.reason}
                </div>

                {req.status === 'pending' && (
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                    <button
                      onClick={() => handleApprovalAction(req.id, false)}
                      className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-950/60 border border-red-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Rejeter la Demande
                    </button>
                    <button
                      onClick={() => handleApprovalAction(req.id, true)}
                      className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-lg transition-colors cursor-pointer shadow-md"
                    >
                      Approuver & Valider l'Opération
                    </button>
                  </div>
                )}
              </div>
            ))}

            {state.approvalRequests.length === 0 && (
              <div className="bg-slate-900/90 p-12 text-center text-slate-500 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-xs">Aucune demande d'autorisation en attente</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GESTION DES UTILISATEURS & RÔLES */}
      {activeSubTab === 'admin_users' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Comptes Utilisateurs & Rôles du Supermarché
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Matrice des habilitations selon le principe de séparation des tâches.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Collaborateur</th>
                    <th className="px-4 py-3 font-semibold">Rôle Officiel</th>
                    <th className="px-4 py-3 font-semibold">Email & Téléphone</th>
                    <th className="px-4 py-3 font-semibold">Périmètre des Permissions</th>
                    <th className="px-4 py-3 font-semibold text-center">Session Caisse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {state.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <span className="font-semibold text-white">{u.name}</span>
                            <div className="text-[10px] text-slate-500 font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs">
                        {u.role === 'caissier' && 'Ventes, Proforma, Encaissements, Reçus, Clôture caisse'}
                        {u.role === 'comptable' && 'Fixation Prix, TVA, Promotions, Bilan mensuel, Marges'}
                        {u.role === 'ravitailleur' && 'Catalogue, Stocks, Inventaire, Commandes Fournisseurs'}
                        {u.role === 'superadmin' && 'Accès Global Total, Validations, Paramètres'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.activeCashSessionId ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {u.activeCashSessionId ? 'Caisse Ouverte' : 'Non active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: JOURNAL D'AUDIT GLOBAL */}
      {activeSubTab === 'admin_audit' && (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white">
              Journal d'Audit Immuable de Toutes les Opérations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historique inaltérable garantissant la traçabilité intégrale de chaque acteur.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold">Horodatage</th>
                  <th className="px-4 py-3 font-semibold">Acteur & Rôle</th>
                  <th className="px-4 py-3 font-semibold">Action Réalisée</th>
                  <th className="px-4 py-3 font-semibold">Détails Opérationnels</th>
                  <th className="px-4 py-3 font-semibold text-center">Gravité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {state.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR')} {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white">{log.userName}</span>
                      <div className="text-[10px] text-slate-400 capitalize">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-300">{log.action}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-lg">{log.details}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.severity === 'critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : log.severity === 'warning'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PARAMÈTRES GÉNÉRAUX */}
      {activeSubTab === 'admin_config' && (
        <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 shadow-xl max-w-2xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Paramètres Généraux du Supermarché</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Enseigne / Nom du Supermarché :</label>
              <input
                type="text"
                value={configForm.name}
                onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Slogan :</label>
              <input
                type="text"
                value={configForm.slogan}
                onChange={(e) => setConfigForm({ ...configForm, slogan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Téléphone :</label>
                <input
                  type="text"
                  value={configForm.phone}
                  onChange={(e) => setConfigForm({ ...configForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">NINEA / RCCM :</label>
                <input
                  type="text"
                  value={configForm.taxNumber}
                  onChange={(e) => setConfigForm({ ...configForm, taxNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Taux TVA par Défaut (%) :</label>
                <input
                  type="number"
                  value={configForm.defaultVatRate}
                  onChange={(e) => setConfigForm({ ...configForm, defaultVatRate: parseFloat(e.target.value) || 18 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Seuil Alerte Stock Global :</label>
                <input
                  type="number"
                  value={configForm.lowStockGlobalThreshold}
                  onChange={(e) => setConfigForm({ ...configForm, lowStockGlobalThreshold: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="allowCredit"
                checked={configForm.allowCreditSales}
                onChange={(e) => setConfigForm({ ...configForm, allowCreditSales: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="allowCredit" className="text-slate-300 font-medium">
                Autoriser les ventes à crédit et paiements partiels en caisse
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              Sauvegarder les Paramètres
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
