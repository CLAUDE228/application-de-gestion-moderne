import React from 'react';
import {
  X,
  Building2,
  HeartPulse,
  ShoppingCart,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Package,
  Calendar,
  Truck,
  Sparkles,
} from 'lucide-react';
import { store } from '../../../services/store';
import { BusinessSector } from '../../../types';

interface SectorAdaptationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SectorAdaptationModal: React.FC<SectorAdaptationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const state = store.getState();
  const currentSector: BusinessSector = state.config.businessSector || 'supermarche';

  const handleSelectSector = (sector: BusinessSector) => {
    store.switchSector(sector);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full text-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-950 via-[#0a1428] to-[#141b34] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Adaptabilité Multi-Secteurs du Stock</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase">
                  Architecture Agnostique
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                L'application gère nativement le stock de <strong>Supermarché</strong>, d'<strong>Officine Pharmaceutique</strong> et de <strong>Matériaux BTP</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* Executive Answer to the user question */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-amber-950/40 border border-blue-500/30 text-xs text-slate-200 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Oui ! L'application est 100% adaptable à tout type de stock d'articles</span>
            </div>
            <p>
              Le moteur de données (modèle relationnel <strong>Laravel Eloquent</strong> + contrôles <strong>Angular & Tailwind</strong>) est conçu de manière <em>agnostique</em>. 
              Chaque produit possède une <strong>unité de mesure paramétrable</strong> (kg, m³, tonne, boîte, sac, flacon), un <strong>taux de TVA propre</strong> (0% pour médicaments et denrées vitales, 18% standard), une <strong>traçabilité de lot & date de péremption</strong> (obligatoire en pharmacie), et des <strong>spécifications techniques</strong> (normes et résistances en BTP).
            </p>
          </div>

          {/* Interactive Sector Switcher Cards */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Sélectionnez un secteur pour charger instantanément ses articles réels :</span>
              <span className="text-[11px] text-amber-400 font-mono">1 clic = bascule en direct</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* CARD 1: SUPERMARCHÉ */}
              <div
                onClick={() => handleSelectSector('supermarche')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentSector === 'supermarche'
                    ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    {currentSector === 'supermarche' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">Supermarché & Retail</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Produits de grande consommation (PGC), alimentation, boissons, produits frais, entretien.
                  </p>

                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Scanner code-barres EAN-13 rapide
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Promotions groupées & remises caisse
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Unités : paquet, sac, bouteille, kg, pièce
                    </li>
                  </ul>
                </div>

                <button
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentSector === 'supermarche'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {currentSector === 'supermarche' ? 'Secteur Actuel' : 'Charger Supermarché'}
                </button>
              </div>

              {/* CARD 2: PHARMACIE */}
              <div
                onClick={() => handleSelectSector('pharmacie')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentSector === 'pharmacie'
                    ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    {currentSector === 'pharmacie' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">Pharmacie & Officine</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Médicaments, antibiotiques, sérums, antiseptiques, matériel médical et parapharmacie.
                  </p>

                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
                    <li className="flex items-center gap-1.5">
                      <span className="text-cyan-400">✓</span> Suivi Lots & Péremptions (FEFO strict)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-cyan-400">✓</span> Ordonnance médicale (Prescription vs OTC)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-cyan-400">✓</span> TVA 0% santé (exonération vitale)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-cyan-400">✓</span> Unités : boîte, flacon, plaquette, tube
                    </li>
                  </ul>
                </div>

                <button
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentSector === 'pharmacie'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {currentSector === 'pharmacie' ? 'Secteur Actuel' : 'Charger Pharmacie'}
                </button>
              </div>

              {/* CARD 3: BTP & MATÉRIAUX */}
              <div
                onClick={() => handleSelectSector('btp')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentSector === 'btp'
                    ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {currentSector === 'btp' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">BTP & Matériaux Pro</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Gros œuvre, ciment 50kg, fers à béton, agrégats (m³, tonne), peintures et outillage.
                  </p>

                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Unités de masse/volume : m³, tonne, sac 50kg
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Fiches techniques (MPa, normes NF/EN)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Ventes proforma & crédit chantiers (45j)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Ravitaillement par bennes et camions
                    </li>
                  </ul>
                </div>

                <button
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentSector === 'btp'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {currentSector === 'btp' ? 'Secteur Actuel' : 'Charger BTP & Matériaux'}
                </button>
              </div>

            </div>
          </div>

          {/* Comparative Matrix Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Matrice Comparative des Spécificités Métier</span>
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                    <th className="p-3">Critère Métier</th>
                    <th className="p-3 text-emerald-300">🛒 Supermarché</th>
                    <th className="p-3 text-cyan-300">💊 Pharmacie</th>
                    <th className="p-3 text-amber-300">🏗️ BTP & Matériaux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">Unités principales</td>
                    <td className="p-3">Pièce, kg, litre, paquet, carton</td>
                    <td className="p-3">Boîte, flacon, plaquette, ampoule</td>
                    <td className="p-3">Tonne, m³, sac 50kg, mètre, fût</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">Traçabilité & Hygiène</td>
                    <td className="p-3">DLC / DLUO standard</td>
                    <td className="p-3 font-medium text-cyan-300">Lots sanitaires + FEFO obligatoire</td>
                    <td className="p-3">N° Coulée d'acier, lots de clinker</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">Réglementation Vente</td>
                    <td className="p-3">Vente libre tout public</td>
                    <td className="p-3 font-medium text-cyan-300">Contrôle ordonnance (Prescription)</td>
                    <td className="p-3">Devis préalable, fiches techniques</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">Fiscalité & TVA</td>
                    <td className="p-3">0% (pain, riz, lait) ou 18% standard</td>
                    <td className="p-3 font-medium text-emerald-400">0% exonération médicaments vitaux</td>
                    <td className="p-3">18% standard</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">Logistique & Entrepôt</td>
                    <td className="p-3">Rayonnage magasin + réserve</td>
                    <td className="p-3">Tiroirs officine + frigo (2-8°C)</td>
                    <td className="p-3 font-medium text-amber-400">Parc extérieur, silo, bennes pesées</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">Conditions de Vente</td>
                    <td className="p-3">Paiement comptant / Mobile Money</td>
                    <td className="p-3">Comptant / Tiers-Payant Mutuelles</td>
                    <td className="p-3 font-medium text-amber-400">Acomptes, crédit chantiers (30-60j)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Secteur actuellement actif : <strong className="text-amber-400 uppercase font-mono">{state.config.name}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
