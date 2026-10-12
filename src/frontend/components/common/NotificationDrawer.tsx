import React from 'react';
import { X, AlertTriangle, Truck, ShieldAlert, CheckCircle } from 'lucide-react';
import { store, formatFCFA } from '../../../services/store';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  const state = store.getState();

  const stockAlerts = state.products.filter(
    (p) => p.isActive && p.currentStock <= p.alertThreshold
  );

  const pendingApprovals = state.approvalRequests.filter(
    (a) => a.status === 'pending'
  );

  const recentReceptions = state.purchaseOrders.filter(
    (po) => po.status === 'received'
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-700 text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] border-b border-slate-800 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Centre d'Alertes & Notifications</h3>
            <p className="text-[11px] text-slate-400">Événements en temps réel du supermarché</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Section 1: Stock Alerts */}
          <div className="space-y-3">
            <h4 className="font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Stocks Critiques ({stockAlerts.length})</span>
              </span>
              <button
                onClick={() => {
                  onNavigateToTab('inv_catalog');
                  onClose();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Voir au catalogue
              </button>
            </h4>

            <div className="space-y-2">
              {stockAlerts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 bg-red-950/40 rounded-xl border border-red-800/60 space-y-1"
                >
                  <div className="flex justify-between items-start font-semibold text-white">
                    <span>{prod.name}</span>
                    <span className="font-mono text-red-400 font-bold">
                      {prod.currentStock} {prod.unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Seuil d'alerte : {prod.alertThreshold} {prod.unit} · Réf : {prod.reference}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Lot : {prod.lotNumber} · DLC : {prod.expiryDate}
                  </div>
                </div>
              ))}

              {stockAlerts.length === 0 && (
                <p className="text-slate-500 italic">Tous les stocks sont au-dessus des seuils d'alerte.</p>
              )}
            </div>
          </div>

          {/* Section 2: Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Validations Requises ({pendingApprovals.length})</span>
              </h4>

              <div className="space-y-2">
                {pendingApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/60 space-y-1"
                  >
                    <div className="flex justify-between font-semibold text-white">
                      <span>{req.targetLabel}</span>
                      <span className="text-amber-400 font-mono font-bold">
                        {req.amountOrValue ? formatFCFA(req.amountOrValue) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">Demandeur : {req.requesterName}</p>
                    <p className="text-[11px] text-slate-400 italic">Motif : {req.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Recent Receptions */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-emerald-400">
              <Truck className="w-4 h-4" />
              <span>Dernières Réceptions Fournisseurs</span>
            </h4>

            <div className="space-y-2">
              {recentReceptions.map((po) => (
                <div
                  key={po.id}
                  className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 space-y-1"
                >
                  <div className="flex justify-between font-semibold text-white">
                    <span>{po.supplierName}</span>
                    <span className="font-mono text-emerald-400 font-bold">{po.orderNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Montant : {formatFCFA(po.totalCost)} · Réceptionné le {po.deliveryDate}
                  </div>
                  <div className="text-[10px] text-slate-500 italic">
                    {po.receptionNotes || 'Conforme'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
