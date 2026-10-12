import React from 'react';
import { Printer, X, FileText } from 'lucide-react';
import { Sale, SupermarketConfig } from '../../../types';
import { formatFCFA } from '../../../services/store';

interface ReceiptModalProps {
  sale: Sale | null;
  config: SupermarketConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  config,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const isProforma = sale.type === 'proforma';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-700">
        
        {/* Modal Controls (Hidden in print) */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              {isProforma ? 'Facture Proforma' : 'Ticket de Caisse & Facture Définitive'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (Authentic White Receipt for physical printers) */}
        <div className="p-6 overflow-y-auto max-h-[80vh] bg-slate-950 flex justify-center">
          <div
            id="printable-area"
            className="w-full max-w-sm bg-white p-6 shadow-2xl border border-slate-300 rounded-lg text-slate-950 font-sans text-xs leading-relaxed"
          >
            {/* Header info */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                {config.name}
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">{config.slogan}</p>
              <p className="text-[11px] text-slate-700 mt-1">{config.address}</p>
              <p className="text-[11px] text-slate-700">Tél: {config.phone}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{config.taxNumber}</p>
            </div>

            {/* Document Details */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">
                  {isProforma ? 'DEVIS PROFORMA N°' : 'FACTURE N°'}
                </span>
                <span className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date & Heure:</span>
                <span className="font-mono">
                  {new Date(sale.date).toLocaleDateString('fr-FR')} {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Caissier(e):</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between text-slate-600">
                  <span>Client:</span>
                  <span className="font-medium text-slate-800">{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] text-slate-600 border-b border-slate-200">
                    <th className="pb-1">Article</th>
                    <th className="pb-1 text-center">Qté</th>
                    <th className="pb-1 text-right">P.U TTC</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-1.5 pr-1">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        {item.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Remise: -{formatFCFA(item.discountAmount)}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                      <td className="py-1.5 text-right font-mono text-slate-700">
                        {formatFCFA(item.unitPrice)}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                        {formatFCFA(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Calculations */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Brut HT :</span>
                <span className="font-mono">{formatFCFA(sale.subtotalHT)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA (Règlementaire) :</span>
                <span className="font-mono">{formatFCFA(sale.vatTotal)}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Remises Déduites :</span>
                  <span className="font-mono">-{formatFCFA(sale.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL À PAYER TTC :</span>
                <span className="font-mono text-emerald-800 font-extrabold">{formatFCFA(sale.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Mode de Règlement :</span>
                <span className="font-bold uppercase">{sale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Montant Encaissé :</span>
                <span className="font-mono font-bold">{formatFCFA(sale.amountPaid)}</span>
              </div>
              {sale.balanceDue > 0 && (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-1 rounded">
                  <span>Reste à Payer (Crédit) :</span>
                  <span className="font-mono">{formatFCFA(sale.balanceDue)}</span>
                </div>
              )}
            </div>

            {/* Simulated Barcode */}
            <div className="pt-4 text-center">
              <div className="flex justify-center items-center gap-[2px] h-9 mx-auto w-48 bg-white py-1">
                {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 2, 4, 1, 3].map(
                  (w, i) => (
                    <div
                      key={i}
                      className="h-full bg-slate-900"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  )
                )}
              </div>
              <p className="text-[10px] font-mono tracking-widest text-slate-600 mt-1">
                *{sale.invoiceNumber}*
              </p>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                {isProforma
                  ? 'Devis Proforma sans engagement financier immédiat.'
                  : 'Conservez ce ticket. Les produits frais ne sont ni repris ni échangés.'}
              </p>
              <p className="text-[11px] font-bold text-slate-800 mt-1">
                *** MERCI DE VOTRE VISITE ***
              </p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center no-print">
          <span className="text-xs text-slate-400">
            Compatible imprimante thermique 80mm & A4
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
