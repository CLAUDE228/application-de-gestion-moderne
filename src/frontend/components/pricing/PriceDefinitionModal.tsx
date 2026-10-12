import React, { useState } from 'react';
import { X, DollarSign, Tag, Check, Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { store, formatFCFA } from '../../../services/store';
import { Product } from '../../../types';

interface PriceDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAccountingPrices: () => void;
}

export const PriceDefinitionModal: React.FC<PriceDefinitionModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAccountingPrices,
}) => {
  if (!isOpen) return null;

  const state = store.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(state.products[0] || null);
  const [sellingPriceInput, setSellingPriceInput] = useState<number>(
    state.products[0]?.sellingPrice || 0
  );
  const [vatRateInput, setVatRateInput] = useState<number>(state.products[0]?.vatRate ?? 18);
  const [purchasePriceInput, setPurchasePriceInput] = useState<number>(
    state.products[0]?.purchasePrice || 0
  );

  const filteredProducts = state.products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm)
  );

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setSellingPriceInput(prod.sellingPrice);
    setVatRateInput(prod.vatRate);
    setPurchasePriceInput(prod.purchasePrice);
  };

  const handleSavePrice = () => {
    if (!selectedProduct) return;
    store.updatePricing(
      selectedProduct.id,
      sellingPriceInput,
      vatRateInput,
      purchasePriceInput
    );
    alert(`Le prix de ${selectedProduct.name} a été mis à jour à ${formatFCFA(sellingPriceInput)} !`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Où définit-on les prix des articles ?</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-400 text-slate-950 uppercase font-mono">
                  Rôle Comptable
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                La fixation des prix de vente et des taxes relève du <strong>Comptable</strong> (et du Super Admin).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanation Card */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/40 text-xs text-blue-200 leading-relaxed space-y-1.5">
          <p className="font-semibold text-blue-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Règle de Gestion & Sécurité du Supermarché :</span>
          </p>
          <p className="text-[11px] text-slate-300">
            • <strong>Le Caissier</strong> ne peut pas changer les prix (pour éviter toute fraude en caisse).<br />
            • <strong>Le Ravitailleur</strong> gère les quantités et références, mais ne fixe pas les prix de vente.<br />
            • <strong>Le Comptable</strong> définit et ajuste les prix dans son onglet <strong>« Prix & TVA »</strong>, calcule les marges et programme les promotions.
          </p>
        </div>

        {/* Interactive Price Editor */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-300">
              Modifier directement le tarif d'un article :
            </span>
            <button
              onClick={() => {
                onClose();
                onNavigateToAccountingPrices();
              }}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <span>Accéder à la grille complète du Comptable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Product Selector */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer les articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/60 bg-slate-950">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`p-2.5 cursor-pointer transition-colors ${
                      selectedProduct?.id === p.id
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="truncate">{p.name}</span>
                      <span className="font-mono text-amber-400 ml-2">{formatFCFA(p.sellingPrice)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Réf: {p.reference} · Rayon: {p.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Price Inputs */}
            {selectedProduct && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                  {selectedProduct.name}
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Prix d'Achat HT (Fournisseur) :</label>
                  <input
                    type="number"
                    value={purchasePriceInput}
                    onChange={(e) => setPurchasePriceInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-amber-400 font-semibold block mb-1">
                    Prix de Vente Client TTC (FCFA) :
                  </label>
                  <input
                    type="number"
                    value={sellingPriceInput}
                    onChange={(e) => setSellingPriceInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-500/60 rounded-lg font-mono font-bold text-sm text-amber-300 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Taux de TVA :</label>
                  <select
                    value={vatRateInput}
                    onChange={(e) => setVatRateInput(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value={18}>18% (Taux Standard Général)</option>
                    <option value={0}>0% (Exonéré / Première nécessité)</option>
                  </select>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Marge Commerciale :</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{formatFCFA(sellingPriceInput - purchasePriceInput)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taux de Marge :</span>
                    <span className="font-mono font-bold text-slate-200">
                      {sellingPriceInput > 0
                        ? Math.round(((sellingPriceInput - purchasePriceInput) / sellingPriceInput) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleSavePrice}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg transition-colors shadow-lg cursor-pointer"
          >
            Enregistrer le Nouveau Prix
          </button>
        </div>

      </div>
    </div>
  );
};
