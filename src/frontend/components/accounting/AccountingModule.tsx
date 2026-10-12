import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ShoppingBag,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  PieChart as PieIcon,
  BarChart3,
  Search,
  Filter,
  Tag,
  Info,
} from 'lucide-react';
import { Product, Promotion, OperatingExpense, Sale, UserRole } from '../../../types';
import { store, formatFCFA } from '../../../services/store';

interface AccountingModuleProps {
  activeSubTab?: 'acct_prices' | 'acct_analytics' | 'acct_supply' | 'acct_balance' | 'acct_audit';
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  activeSubTab = 'acct_prices',
}) => {
  const state = store.getState();
  const currentUser = store.getCurrentUser();

  // Search & Filters for pricing table
  const [priceSearch, setPriceSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Edit Price Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [newVatRate, setNewVatRate] = useState<number>(18);
  const [newPurchasePrice, setNewPurchasePrice] = useState<number>(0);

  // New Promotion Modal
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoTargetProduct, setPromoTargetProduct] = useState('');
  const [promoType, setPromoType] = useState<'percentage' | 'fixed_discount'>('percentage');
  const [promoValue, setPromoValue] = useState<number>(10);
  const [promoMinQty, setPromoMinQty] = useState<number>(1);
  const [promoStartDate, setPromoStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [promoEndDate, setPromoEndDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  // New Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<OperatingExpense['category']>('loyer');
  const [expenseAmount, setExpenseAmount] = useState<number>(50000);
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'especes' | 'virement' | 'cheque'>('virement');

  // Anomaly reporting
  const [anomalyReason, setAnomalyReason] = useState('');
  const [reportingAnomalyForId, setReportingAnomalyForId] = useState<string | null>(null);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    state.products.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [state.products]);

  // Filtered pricing products
  const filteredProducts = useMemo(() => {
    return state.products.filter((p) => {
      const matchCat = selectedCatFilter === 'all' || p.category === selectedCatFilter;
      const matchSearch =
        p.name.toLowerCase().includes(priceSearch.toLowerCase()) ||
        p.reference.toLowerCase().includes(priceSearch.toLowerCase()) ||
        p.barcode.includes(priceSearch);
      return matchCat && matchSearch;
    });
  }, [state.products, priceSearch, selectedCatFilter]);

  // Sales Analytics Calculations
  const salesDefinitive = useMemo(() => {
    return state.sales.filter((s) => s.type === 'definitive' && s.status === 'completed');
  }, [state.sales]);

  const totalRevenue = useMemo(() => {
    return salesDefinitive.reduce((acc, s) => acc + s.totalAmount, 0);
  }, [salesDefinitive]);

  const totalUnitsSold = useMemo(() => {
    return salesDefinitive.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
  }, [salesDefinitive]);

  const totalDiscountsGiven = useMemo(() => {
    return salesDefinitive.reduce((acc, s) => acc + s.discountTotal, 0);
  }, [salesDefinitive]);

  // COGS (Coût des marchandises vendues - CAMV)
  const totalCOGS = useMemo(() => {
    return salesDefinitive.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + item.purchasePriceAtSale * item.quantity, 0);
    }, 0);
  }, [salesDefinitive]);

  // Marge commerciale brute
  const commercialMargin = useMemo(() => {
    return totalRevenue - totalCOGS;
  }, [totalRevenue, totalCOGS]);

  const marginRatePercent = useMemo(() => {
    if (totalRevenue === 0) return 0;
    return Math.round((commercialMargin / totalRevenue) * 100);
  }, [commercialMargin, totalRevenue]);

  // Total operating expenses
  const totalExpenses = useMemo(() => {
    return state.expenses.reduce((acc, exp) => acc + exp.amount, 0);
  }, [state.expenses]);

  // Net Estimated Result (Bénéfice ou Perte)
  const netEstimatedResult = useMemo(() => {
    return commercialMargin - totalExpenses;
  }, [commercialMargin, totalExpenses]);

  // Stock Valuation
  const totalStockValuation = useMemo(() => {
    return state.products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
  }, [state.products]);

  // Cash in hand & receivables
  const totalCollectedCash = useMemo(() => {
    return salesDefinitive.reduce((acc, s) => acc + s.amountPaid, 0);
  }, [salesDefinitive]);

  const totalClientReceivables = useMemo(() => {
    return salesDefinitive.reduce((acc, s) => acc + s.balanceDue, 0);
  }, [salesDefinitive]);

  const totalSupplierDebts = useMemo(() => {
    return state.suppliers.reduce((acc, sup) => acc + sup.outstandingBalance, 0);
  }, [state.suppliers]);

  // Situation Qualification
  const financialDiagnosis = useMemo(() => {
    if (netEstimatedResult > 50000) {
      return {
        label: 'Situation Excédentaire',
        color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
        desc: 'Les marges commerciales couvrent confortablement l ensemble des charges d exploitation du supermarché.',
      };
    } else if (netEstimatedResult >= -20000) {
      return {
        label: 'Situation à l Équilibre',
        color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
        desc: 'Les revenus équilibrent les charges fixes et variables. La rentabilité nette est stable.',
      };
    } else {
      return {
        label: 'Situation Déficitaire',
        color: 'text-red-400 bg-red-950/60 border-red-800/60',
        desc: 'Les charges de fonctionnement et le coût d achat dépassent le chiffre d affaires net généré sur la période.',
      };
    }
  }, [netEstimatedResult]);

  // Payment methods breakdown
  const paymentMethodStats = useMemo(() => {
    const stats: Record<string, number> = {
      especes: 0,
      wave: 0,
      orange_money: 0,
      mtn_momo: 0,
      carte: 0,
      credit: 0,
    };
    salesDefinitive.forEach((s) => {
      stats[s.paymentMethod] = (stats[s.paymentMethod] || 0) + s.amountPaid;
    });
    return stats;
  }, [salesDefinitive]);

  // Top products sold
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    salesDefinitive.forEach((s) => {
      s.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        map[item.productId].quantity += item.quantity;
        map[item.productId].revenue += item.total;
      });
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [salesDefinitive]);

  // Purchase Order Stats
  const totalPurchaseOrdersCost = useMemo(() => {
    return state.purchaseOrders.reduce((acc, po) => acc + po.totalCost, 0);
  }, [state.purchaseOrders]);

  const receivedOrdersCost = useMemo(() => {
    return state.purchaseOrders
      .filter((po) => po.status === 'received')
      .reduce((acc, po) => acc + po.totalCost, 0);
  }, [state.purchaseOrders]);

  // Pricing edit save
  const handleSavePriceEdit = () => {
    if (!editingProduct) return;
    store.updatePricing(
      editingProduct.id,
      newSellingPrice,
      newVatRate,
      newPurchasePrice
    );
    setEditingProduct(null);
  };

  // Promotion save
  const handleSavePromotion = () => {
    if (!promoTitle.trim()) {
      alert('Titre de la promotion requis.');
      return;
    }
    const targetProd = state.products.find((p) => p.id === promoTargetProduct);
    store.addPromotion({
      title: promoTitle,
      productId: promoTargetProduct || undefined,
      category: targetProd ? targetProd.category : undefined,
      type: promoType,
      value: promoValue,
      minQuantity: promoMinQty,
      startDate: promoStartDate,
      endDate: promoEndDate,
      isActive: true,
      createdBy: `${currentUser.name} (Comptable)`,
    });
    setIsPromoModalOpen(false);
    setPromoTitle('');
  };

  // Expense save
  const handleSaveExpense = () => {
    if (!expenseLabel.trim() || !expensePaidTo.trim()) {
      alert('Veuillez remplir le libellé et le bénéficiaire.');
      return;
    }
    store.addExpense({
      date: new Date().toISOString().split('T')[0],
      category: expenseCategory,
      label: expenseLabel,
      amount: expenseAmount,
      paymentMethod: expensePaymentMethod,
      paidTo: expensePaidTo,
    });
    setIsExpenseModalOpen(false);
    setExpenseLabel('');
    setExpensePaidTo('');
  };

  // Anomaly report
  const handleReportAnomaly = (targetId: string, context: string) => {
    if (!anomalyReason.trim()) {
      alert('Veuillez expliciter le motif de l anomalie constatée.');
      return;
    }
    store.sendMessage({
      recipientRole: 'superadmin',
      subject: `Signalement d'Anomalie Comptable : ${context}`,
      body: `Le comptable (${currentUser.name}) a relevé une anomalie : ${anomalyReason}. Référence ciblée : ${targetId}.`,
      priority: 'urgent',
      actionRequired: true,
    });
    store.logAudit(
      'Signalement d anomalie comptable',
      'comptabilite',
      `Anomalie signalée pour ${context}: "${anomalyReason}"`,
      'warning'
    );
    setReportingAnomalyForId(null);
    setAnomalyReason('');
    alert('Anomalie transmise au Super Administrateur avec notification immédiate.');
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* EXPLICIT CALLOUT BOX: WHERE ARE ARTICLE PRICES DEFINED? */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-[#101935] border border-amber-500/50 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span>Où définit-on les prix des articles ?</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold uppercase">
                Réponse directe
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Les prix de vente et la TVA sont configurés <strong>exclusivement ici dans le module du Comptable</strong> (Onglet <em>« Prix & TVA »</em> ci-dessous). Cliquez sur <em>« Modifier Prix »</em> sur n'importe quel article pour ajuster son tarif.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const first = state.products[0];
            if (first) {
              setEditingProduct(first);
              setNewSellingPrice(first.sellingPrice);
              setNewVatRate(first.vatRate);
              setNewPurchasePrice(first.purchasePrice);
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md whitespace-nowrap"
        >
          Modifier un Tarif Maintenant
        </button>
      </div>

      {/* MODULE HEADER STATS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Chiffre d'Affaires</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {formatFCFA(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>{totalUnitsSold} articles vendus</span>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Marge Commerciale</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {formatFCFA(commercialMargin)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Taux de marge : <span className="font-mono font-bold text-amber-400">{marginRatePercent}%</span>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Valeur du Stock (Coût)</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-300">
            {formatFCFA(totalStockValuation)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {state.products.length} références actives
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Résultat Net Estimé</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-lg font-bold font-mono ${netEstimatedResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatFCFA(netEstimatedResult)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {financialDiagnosis.label}
          </div>
        </div>
      </div>

      {/* SUB-TAB A: GESTION DES PRIX ET DE LA FISCALITÉ */}
      {activeSubTab === 'acct_prices' && (
        <div className="space-y-6">
          
          {/* Header controls */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[260px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par article, réf, code-barres..."
                  value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:bg-slate-950 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Toutes catégories' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPromoModalOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Programmer une Promotion</span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wide">
                Grille Tarifaire, TVA & Marges Commerciales
              </span>
              <span className="text-slate-400 font-mono">
                {filteredProducts.length} articles répertoriés
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Article & Référence</th>
                    <th className="px-4 py-3 font-semibold">Rayon</th>
                    <th className="px-4 py-3 font-semibold text-right">Prix Achat HT</th>
                    <th className="px-4 py-3 font-semibold text-right">Prix Vente TTC</th>
                    <th className="px-4 py-3 font-semibold text-center">TVA</th>
                    <th className="px-4 py-3 font-semibold text-right">Marge Brute (FCFA)</th>
                    <th className="px-4 py-3 font-semibold text-right">Taux Marge %</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map((prod) => {
                    const margin = prod.sellingPrice - prod.purchasePrice;
                    const marginRate = prod.sellingPrice > 0 ? Math.round((margin / prod.sellingPrice) * 100) : 0;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{prod.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {prod.reference} · {prod.barcode}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{prod.category}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {formatFCFA(prod.purchasePrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                          {formatFCFA(prod.sellingPrice)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
                            prod.vatRate === 0
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`}>
                            {prod.vatRate}% {prod.vatRate === 0 ? '(Exonéré)' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                          +{formatFCFA(margin)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-300">
                          {marginRate}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setNewSellingPrice(prod.sellingPrice);
                              setNewVatRate(prod.vatRate);
                              setNewPurchasePrice(prod.purchasePrice);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-400/20 rounded border border-amber-500/50 transition-colors cursor-pointer"
                          >
                            Modifier Prix
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Promotions List */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center justify-between">
              <span>Promotions & Remises Actives sur la Caisse</span>
              <span className="text-xs font-normal text-slate-400">
                {state.promotions.filter((p) => p.isActive).length} promotions en cours
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {state.promotions.map((pr) => (
                <div
                  key={pr.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
                    pr.isActive
                      ? 'border-emerald-700/60 bg-emerald-950/40'
                      : 'border-slate-800 bg-slate-950 opacity-50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-white">{pr.title}</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {pr.type === 'percentage' ? `-${pr.value}%` : `-${formatFCFA(pr.value)}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Condition : Dès {pr.minQuantity} unité(s)
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Valable du {pr.startDate} au {pr.endDate}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 italic">
                      Par {pr.createdBy.split(' ')[0]}
                    </span>
                    <button
                      onClick={() => store.togglePromotion(pr.id)}
                      className={`text-[11px] font-bold cursor-pointer ${
                        pr.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {pr.isActive ? 'Suspendre' : 'Activer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB B: STATISTIQUES VISUELLES DES VENTES */}
      {activeSubTab === 'acct_analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Payment Methods Breakdown */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                <span>Encaissements par Moyen de Paiement</span>
              </h3>
              
              <div className="space-y-3 pt-2">
                {[
                  { key: 'especes', label: 'Espèces', color: 'bg-emerald-500' },
                  { key: 'wave', label: 'Mobile Money - Wave', color: 'bg-sky-400' },
                  { key: 'orange_money', label: 'Orange Money / MTN MoMo', color: 'bg-amber-400' },
                  { key: 'carte', label: 'Carte Bancaire', color: 'bg-indigo-400' },
                  { key: 'credit', label: 'Ventes à Crédit (Acomptes)', color: 'bg-purple-400' },
                ].map((item) => {
                  const amount = paymentMethodStats[item.key] || 0;
                  const pct = totalCollectedCash > 0 ? Math.round((amount / totalCollectedCash) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>{item.label}</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatFCFA(amount)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Total Encaissé en Trésorerie :</span>
                <span className="font-mono font-bold text-cyan-400">{formatFCFA(totalCollectedCash)}</span>
              </div>
            </div>

            {/* Top 5 Products Sold */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Top 5 des Produits les Plus Vendus</span>
              </h3>

              <div className="space-y-3 pt-2">
                {topProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-mono flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{prod.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white">{prod.quantity} vendus</span>
                      <div className="text-[10px] text-amber-400 font-mono">{formatFCFA(prod.revenue)}</div>
                    </div>
                  </div>
                ))}

                {topProducts.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">Aucune vente enregistrée pour le moment</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Incidence des Remises Promo :</span>
                <span className="font-mono font-bold text-red-400">-{formatFCFA(totalDiscountsGiven)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB C: ANALYSE DES ACHATS ET DU RAVITAILLEMENT */}
      {activeSubTab === 'acct_supply' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 block">Commandes Fournisseurs Émises</span>
              <span className="text-base font-bold font-mono text-white mt-1 block">
                {formatFCFA(totalPurchaseOrdersCost)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                {state.purchaseOrders.length} bons de commande
              </span>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 block">Marchandises Réceptionnées</span>
              <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
                {formatFCFA(receivedOrdersCost)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                Intégrées physiquement en rayon
              </span>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 block">Dettes Fournisseurs en Attente</span>
              <span className="text-base font-bold font-mono text-amber-400 mt-1 block">
                {formatFCFA(totalSupplierDebts)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                Factures à régler sous échéance
              </span>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800">
              <h3 className="font-bold text-xs uppercase text-amber-400">
                Suivi des Fournisseurs Principaux & Dettes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fournisseur</th>
                    <th className="px-4 py-3 font-semibold">Rayon d'Activité</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold text-right">Encours Dettes (FCFA)</th>
                    <th className="px-4 py-3 font-semibold text-center">Statut Compte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {state.suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-semibold text-white">{sup.name}</td>
                      <td className="px-4 py-3 text-slate-300">{sup.category}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{sup.phone}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                        {formatFCFA(sup.outstandingBalance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Régulier
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

      {/* SUB-TAB D: BILAN MENSUEL ET ANALYSE FINANCIÈRE */}
      {activeSubTab === 'acct_balance' && (
        <div className="space-y-6">
          
          {/* Diagnostic Banner */}
          <div className={`p-4 rounded-xl border ${financialDiagnosis.color} flex items-center justify-between shadow-xl`}>
            <div>
              <span className="text-xs uppercase font-black tracking-wider block">
                Qualification de la Situation Financière
              </span>
              <h3 className="text-base font-extrabold mt-0.5">
                {financialDiagnosis.label}
              </h3>
              <p className="text-xs opacity-90 mt-1 max-w-2xl">
                {financialDiagnosis.desc}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs block opacity-80">Résultat Net :</span>
              <span className="text-xl font-bold font-mono">
                {formatFCFA(netEstimatedResult)}
              </span>
            </div>
          </div>

          {/* Official Indicator Matrix as requested */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-white">Tableau de Bilan & Indicateurs Clés de Gestion</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confrontation Ventes, Achats (CAMV) et Charges d'Exploitation
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une Charge</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800 text-xs">
              <div className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                <div>
                  <span className="font-bold text-white text-sm">1. Chiffre d'Affaires Brut</span>
                  <p className="text-slate-400 text-[11px]">Le montant total des ventes sur la période</p>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">{formatFCFA(totalRevenue)}</span>
              </div>

              <div className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-200">2. Coût des Marchandises Vendues (CAMV)</span>
                  <p className="text-slate-400 text-[11px]">Le coût d'achat des produits réellement sortis en vente</p>
                </div>
                <span className="font-mono font-semibold text-red-400">-{formatFCFA(totalCOGS)}</span>
              </div>

              <div className="px-6 py-3.5 bg-slate-950/60 flex justify-between items-center font-semibold">
                <div>
                  <span className="text-white">3. Marge Commerciale Réalisée</span>
                  <p className="text-slate-400 text-[11px]">Différence brute entre ventes nettes et CAMV</p>
                </div>
                <span className="font-mono font-bold text-emerald-400">{formatFCFA(commercialMargin)}</span>
              </div>

              <div className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-200">4. Charges d'Exploitation du Magasin</span>
                  <p className="text-slate-400 text-[11px]">Loyer commercial, électricité, eau, salaires, maintenance...</p>
                </div>
                <span className="font-mono font-semibold text-red-400">-{formatFCFA(totalExpenses)}</span>
              </div>

              <div className="px-6 py-4 bg-indigo-950/40 border-y border-indigo-900/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-indigo-200 text-sm">5. Résultat Net Estimé (Bénéfice / Perte)</span>
                  <p className="text-indigo-300/80 text-[11px]">Marge commerciale déduite de l'ensemble des charges</p>
                </div>
                <span className={`font-mono font-extrabold text-base ${netEstimatedResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatFCFA(netEstimatedResult)}
                </span>
              </div>

              <div className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-200">6. Trésorerie Immédiate Constatée</span>
                  <p className="text-slate-400 text-[11px]">Fonds réellement encaissés en caisse & comptes</p>
                </div>
                <span className="font-mono font-bold text-cyan-400">{formatFCFA(totalCollectedCash)}</span>
              </div>

              <div className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-200">7. Créances Clients (Ventes à crédit)</span>
                  <p className="text-slate-400 text-[11px]">Sommes dues par les clients à recouvrer</p>
                </div>
                <span className="font-mono font-bold text-amber-400">{formatFCFA(totalClientReceivables)}</span>
              </div>

              <div className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-200">8. Dettes Fournisseurs</span>
                  <p className="text-slate-400 text-[11px]">Sommes restant à régler aux fournisseurs</p>
                </div>
                <span className="font-mono font-bold text-slate-300">{formatFCFA(totalSupplierDebts)}</span>
              </div>

              <div className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-200">9. Valeur du Stock Disponible</span>
                  <p className="text-slate-400 text-[11px]">Capital immobilisé dans les articles en rayon et réserve</p>
                </div>
                <span className="font-mono font-bold text-amber-400">{formatFCFA(totalStockValuation)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB E: CONTRÔLE DES OPÉRATIONS & AUDIT */}
      {activeSubTab === 'acct_audit' && (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-white">
                Contrôle des Opérations & Journal d'Audit
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Surveillance de la caisse, des ravitaillements et signalement d'anomalies sans modification silencieuse.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Horodatage</th>
                  <th className="px-4 py-3 font-semibold">Acteur</th>
                  <th className="px-4 py-3 font-semibold">Opération / Module</th>
                  <th className="px-4 py-3 font-semibold">Détails & Justification</th>
                  <th className="px-4 py-3 font-semibold text-center">Niveau</th>
                  <th className="px-4 py-3 font-semibold text-right">Contrôle</th>
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
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-300">{log.action}</span>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{log.module}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-md">
                      {log.details}
                    </td>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setReportingAnomalyForId(log.id)}
                        className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                      >
                        Signaler anomalie
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT PRICE MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Modifier le Prix & la TVA : {editingProduct.name}
            </h3>
            <p className="text-xs text-slate-400">
              Les ventes passées conserveront le prix historique auquel elles ont été émises.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Prix d'Achat HT (FCFA) :</label>
                <input
                  type="number"
                  value={newPurchasePrice}
                  onChange={(e) => setNewPurchasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                />
              </div>

              <div>
                <label className="text-amber-400 font-semibold block mb-1">
                  Nouveau Prix de Vente TTC (FCFA) :
                </label>
                <input
                  type="number"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-500/60 rounded-lg font-mono font-bold text-sm text-amber-300 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Taux de TVA (%) :</label>
                <select
                  value={newVatRate}
                  onChange={(e) => setNewVatRate(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                >
                  <option value={18}>18% (Taux Standard Général)</option>
                  <option value={0}>0% (Exonéré / Produits de première nécessité)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 text-[11px] space-y-1">
                <div>
                  Marge unitaire estimée :{' '}
                  <span className="font-mono font-bold text-emerald-400">
                    +{formatFCFA(newSellingPrice - newPurchasePrice)}
                  </span>
                </div>
                <div>
                  Taux de marge brute :{' '}
                  <span className="font-mono font-bold text-amber-400">
                    {newSellingPrice > 0
                      ? Math.round(((newSellingPrice - newPurchasePrice) / newSellingPrice) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePriceEdit}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg cursor-pointer shadow-md"
              >
                Appliquer le Tarif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROMOTION MODAL */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Programmer une Nouvelle Promotion
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Titre de l'Offre :</label>
                <input
                  type="text"
                  placeholder="Ex: Offre Pack Weekend -15%"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Article Concerné :</label>
                <select
                  value={promoTargetProduct}
                  onChange={(e) => setPromoTargetProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Sélectionnez un article</option>
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatFCFA(p.sellingPrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Type de Réduction :</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed_discount">Montant Fixe (FCFA)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Valeur de Réduction :</label>
                  <input
                    type="number"
                    value={promoValue}
                    onChange={(e) => setPromoValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quantité Minimale Requise :</label>
                <input
                  type="number"
                  min="1"
                  value={promoMinQty}
                  onChange={(e) => setPromoMinQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Date Début :</label>
                  <input
                    type="date"
                    value={promoStartDate}
                    onChange={(e) => setPromoStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Date Fin :</label>
                  <input
                    type="date"
                    value={promoEndDate}
                    onChange={(e) => setPromoEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePromotion}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg"
              >
                Enregistrer la Promotion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Enregistrer une Charge d'Exploitation
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Catégorie :</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white capitalize"
                >
                  <option value="loyer">Loyer Commercial</option>
                  <option value="electricite_eau">Électricité & Eau</option>
                  <option value="salaires">Salaires & Primes</option>
                  <option value="emballages">Emballages & Sacs de caisse</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="transport">Transport</option>
                  <option value="autre">Autre dépense</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Libellé :</label>
                <input
                  type="text"
                  placeholder="Ex: Facture électricité chambre froide"
                  value={expenseLabel}
                  onChange={(e) => setExpenseLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Montant Décaissé (FCFA) :</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bénéficiaire :</label>
                <input
                  type="text"
                  placeholder="Ex: Senelec / SDE / Bailleur"
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveExpense}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-lg"
              >
                Comptabiliser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT ANOMALY MODAL */}
      {reportingAnomalyForId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">
                Signaler une Anomalie au Super Administrateur
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              L'écriture d'origine restera inchangée pour respecter la piste d'audit.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-semibold block">
                Explication précise de l'anomalie :
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Écart anormal entre le prix facturé et le tarif officiel..."
                value={anomalyReason}
                onChange={(e) => setAnomalyReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setReportingAnomalyForId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReportAnomaly(reportingAnomalyForId, `Ligne ${reportingAnomalyForId}`)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg"
              >
                Envoyer le Signalement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
