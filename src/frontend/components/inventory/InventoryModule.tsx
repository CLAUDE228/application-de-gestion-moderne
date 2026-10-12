import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ClipboardList,
  Truck,
  RotateCcw,
  CheckCircle,
  Archive,
  Eye,
  Edit2,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  FileCheck,
  Send,
  Tag,
} from 'lucide-react';
import { Product, Supplier, PurchaseOrder, UnitType } from '../../../types';
import { store, formatFCFA } from '../../../services/store';

interface InventoryModuleProps {
  activeSubTab?: 'inv_catalog' | 'inv_stock' | 'inv_orders' | 'inv_audit';
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  activeSubTab = 'inv_catalog',
}) => {
  const state = store.getState();
  const currentUser = store.getCurrentUser();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStateFilter, setStockStateFilter] = useState<'all' | 'low' | 'out' | 'archived'>('all');

  // New Product Modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdRef, setNewProdRef] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Épicerie');
  const [newProdUnit, setNewProdUnit] = useState<UnitType>('pièce');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState<number>(1000);
  const [newProdInitialStock, setNewProdInitialStock] = useState<number>(20);
  const [newProdAlertThreshold, setNewProdAlertThreshold] = useState<number>(10);
  const [newProdLot, setNewProdLot] = useState('LT-2026-');
  const [newProdExpiry, setNewProdExpiry] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  );
  const [newProdDescription, setNewProdDescription] = useState('');

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Loss / Damage Modal
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [lossProductId, setLossProductId] = useState('');
  const [lossQty, setLossQty] = useState<number>(1);
  const [lossReason, setLossReason] = useState('');

  // Physical Inventory Count Modal
  const [isInventoryCountModalOpen, setIsInventoryCountModalOpen] = useState(false);
  const [invCountProductId, setInvCountProductId] = useState('');
  const [invCountActualStock, setInvCountActualStock] = useState<number>(0);
  const [invCountJustification, setInvCountJustification] = useState('');

  // New Purchase Order Modal
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poProductId, setPoProductId] = useState('');
  const [poQty, setPoQty] = useState<number>(50);
  const [poExpectedDate, setPoExpectedDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );

  // Reception Modal
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receptionNotes, setReceptionNotes] = useState('');
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

  // Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupCategory, setNewSupCategory] = useState('Épicerie');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    state.products.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [state.products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return state.products.filter((p) => {
      if (stockStateFilter === 'archived') {
        if (p.isActive) return false;
      } else {
        if (!p.isActive) return false;
        if (stockStateFilter === 'low' && p.currentStock > p.alertThreshold) return false;
        if (stockStateFilter === 'out' && p.currentStock > 0) return false;
      }

      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm);

      return matchCat && matchSearch;
    });
  }, [state.products, searchTerm, categoryFilter, stockStateFilter]);

  // Save new product
  const handleSaveNewProduct = () => {
    if (!newProdName.trim() || !newProdBarcode.trim()) {
      alert('Le nom et le code-barres sont obligatoires.');
      return;
    }

    const autoRef = newProdRef.trim() || 'ART-' + Date.now().toString().slice(-6);

    store.addProduct({
      barcode: newProdBarcode.trim(),
      reference: autoRef,
      name: newProdName.trim(),
      category: newProdCategory,
      unit: newProdUnit,
      purchasePrice: newProdPurchasePrice,
      sellingPrice: Math.round(newProdPurchasePrice * 1.25),
      vatRate: 18,
      currentStock: newProdInitialStock,
      alertThreshold: newProdAlertThreshold,
      lotNumber: newProdLot,
      expiryDate: newProdExpiry,
      isActive: true,
      description: newProdDescription,
    });

    setIsAddProductModalOpen(false);
    setNewProdName('');
    setNewProdBarcode('');
    setNewProdRef('');
    setNewProdInitialStock(20);
    setNewProdAlertThreshold(10);
  };

  // Save edited product
  const handleSaveProductEdit = () => {
    if (!editingProduct) return;
    store.updateProduct(editingProduct.id, {
      name: editingProduct.name,
      reference: editingProduct.reference,
      barcode: editingProduct.barcode,
      category: editingProduct.category,
      unit: editingProduct.unit,
      alertThreshold: editingProduct.alertThreshold,
      lotNumber: editingProduct.lotNumber,
      expiryDate: editingProduct.expiryDate,
      description: editingProduct.description,
    });
    setEditingProduct(null);
  };

  // Submit loss
  const handleSaveLoss = () => {
    if (!lossProductId || !lossReason.trim()) {
      alert('Veuillez sélectionner un article et renseigner le motif obligatoire.');
      return;
    }
    store.recordLossOrDamage(lossProductId, lossQty, lossReason);
    setIsLossModalOpen(false);
    setLossProductId('');
    setLossReason('');
    setLossQty(1);
  };

  // Submit inventory count
  const handleSaveInventoryCount = () => {
    if (!invCountProductId || !invCountJustification.trim()) {
      alert('Veuillez sélectionner un article et justifier le recomptage.');
      return;
    }
    store.recordInventoryAdjustment(invCountProductId, invCountActualStock, invCountJustification);
    setIsInventoryCountModalOpen(false);
    setInvCountProductId('');
    setInvCountJustification('');
  };

  // Submit PO
  const handleSavePO = () => {
    if (!poSupplierId || !poProductId) {
      alert('Veuillez sélectionner un fournisseur et un article.');
      return;
    }
    const targetProd = state.products.find((p) => p.id === poProductId);
    const unitCost = targetProd ? targetProd.purchasePrice : 1000;

    store.createPurchaseOrder(
      poSupplierId,
      [{ productId: poProductId, quantity: poQty, unitCost }],
      poExpectedDate
    );

    setIsPOModalOpen(false);
    setPoProductId('');
  };

  // Start reception
  const handleStartReception = (po: PurchaseOrder) => {
    setReceivingPO(po);
    const initialRecs: Record<string, number> = {};
    po.items.forEach((item) => {
      initialRecs[item.productId] = item.orderedQuantity;
    });
    setReceivedQuantities(initialRecs);
    setReceptionNotes('Marchandises reçues conformes au bon de livraison fournisseur.');
  };

  // Confirm reception
  const handleConfirmReception = () => {
    if (!receivingPO) return;
    const itemsPayload = receivingPO.items.map((it) => ({
      productId: it.productId,
      receivedQuantity: receivedQuantities[it.productId] ?? it.orderedQuantity,
    }));

    store.receivePurchaseOrder(receivingPO.id, itemsPayload, receptionNotes);
    setReceivingPO(null);
  };

  // Save new supplier
  const handleSaveSupplier = () => {
    if (!newSupName.trim() || !newSupPhone.trim()) {
      alert('Nom et téléphone du fournisseur obligatoires.');
      return;
    }
    store.addSupplier({
      name: newSupName,
      category: newSupCategory,
      phone: newSupPhone,
      email: newSupEmail || `${newSupName.toLowerCase().replace(/\s+/g, '')}@fournisseur.sn`,
      address: newSupAddress || 'Dakar, Sénégal',
      productsSuppliedCount: 5,
      outstandingBalance: 0,
    });
    setIsSupplierModalOpen(false);
    setNewSupName('');
    setNewSupPhone('');
  };

  // Stock overview cards
  const totalRefs = state.products.length;
  const lowStockCount = state.products.filter((p) => p.isActive && p.currentStock <= p.alertThreshold && p.currentStock > 0).length;
  const outOfStockCount = state.products.filter((p) => p.isActive && p.currentStock <= 0).length;
  const pendingPOCount = state.purchaseOrders.filter((po) => po.status === 'pending').length;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* OVERVIEW STATS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Catalogue Articles</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {totalRefs} références
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {state.products.filter((p) => p.isActive).length} actives en magasin
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Sous Seuil d'Alerte</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400">
            {lowStockCount} articles
          </div>
          <div className="text-[11px] text-amber-300 mt-1 font-medium">
            Réapprovisionnement suggéré
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ruptures Totales</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-lg font-bold font-mono text-red-400">
            {outOfStockCount} articles
          </div>
          <div className="text-[11px] text-red-300 mt-1 font-medium">
            Rayons vides à réapprovisionner
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Commandes en Cours</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {pendingPOCount} bons
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Livraisons fournisseurs attendues
          </div>
        </div>
      </div>

      {/* SUB-TAB A: CATALOGUE PRODUITS */}
      {activeSubTab === 'inv_catalog' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[280px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, référence, code-barres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:bg-slate-950 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Toutes catégories' : c}
                  </option>
                ))}
              </select>

              <select
                value={stockStateFilter}
                onChange={(e) => setStockStateFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="all">Tous les états</option>
                <option value="low">Stock faible</option>
                <option value="out">Rupture totale</option>
                <option value="archived">Articles archivés</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un Nouvel Article</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wide">
                Fiches Articles du Supermarché
              </span>
              <span className="text-slate-400 font-mono">
                {filteredProducts.length} articles affichés
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Article & Code-barres</th>
                    <th className="px-4 py-3 font-semibold">Catégorie</th>
                    <th className="px-4 py-3 font-semibold">Unité</th>
                    <th className="px-4 py-3 font-semibold text-right">Stock Actuel</th>
                    <th className="px-4 py-3 font-semibold text-right">Seuil Alerte</th>
                    <th className="px-4 py-3 font-semibold">N° Lot & Péremption</th>
                    <th className="px-4 py-3 font-semibold text-center">Statut</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.currentStock <= prod.alertThreshold && prod.currentStock > 0;
                    const isOut = prod.currentStock <= 0;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{prod.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Réf: {prod.reference} · Code: {prod.barcode}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{prod.category}</td>
                        <td className="px-4 py-3 text-slate-300 capitalize">{prod.unit}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span
                            className={
                              isOut
                                ? 'text-red-400 font-black'
                                : isLow
                                ? 'text-amber-400 font-bold'
                                : 'text-white'
                            }
                          >
                            {prod.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {prod.alertThreshold}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <div className="font-mono text-[11px]">{prod.lotNumber}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Exp: {prod.expiryDate}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              !prod.isActive
                                ? 'bg-slate-800 text-slate-400'
                                : isOut
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {!prod.isActive ? 'Archivé' : isOut ? 'Rupture' : isLow ? 'Alerte' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingProduct(prod)}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                              title="Modifier la fiche article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => store.toggleProductStatus(prod.id)}
                              className={`p-1 rounded cursor-pointer ${
                                prod.isActive
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/40'
                                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                              title={prod.isActive ? 'Archiver cet article' : 'Réactiver cet article'}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB B: MOUVEMENTS DE STOCK & PERTES */}
      {activeSubTab === 'inv_stock' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
            <div>
              <h3 className="font-bold text-sm text-white">
                Déclarations d'Écarts & Pertes en Rayon
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enregistrez les casses, produits périmés ou vols avec motif obligatoire pour préserver la traçabilité.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsLossModalOpen(true)}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                <span>Déclarer une Perte / Casse</span>
              </button>
              <button
                onClick={() => setIsInventoryCountModalOpen(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Ajustement d'Inventaire</span>
              </button>
            </div>
          </div>

          {/* Movements History */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wide">
                Journal des Mouvements de Stock
              </span>
              <span className="text-slate-400 font-mono">{state.stockMovements.length} mouvements</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date & Heure</th>
                    <th className="px-4 py-3 font-semibold">Article</th>
                    <th className="px-4 py-3 font-semibold">Type de Mouvement</th>
                    <th className="px-4 py-3 font-semibold text-center">Variation</th>
                    <th className="px-4 py-3 font-semibold text-right">Ancien / Nouveau Stock</th>
                    <th className="px-4 py-3 font-semibold">Motif / Justification</th>
                    <th className="px-4 py-3 font-semibold text-right">Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {state.stockMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(mov.date).toLocaleDateString('fr-FR')} {new Date(mov.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{mov.productName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          mov.type === 'reception'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : mov.type === 'sale'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : mov.type === 'loss_breakage'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {mov.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        <span className={mov.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {mov.previousStock} &rarr; <span className="font-bold text-white">{mov.newStock}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-sm">
                        {mov.reason}
                        <div className="text-[10px] text-slate-500 font-mono">Réf: {mov.referenceNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200 font-medium whitespace-nowrap">
                        {mov.userName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB C: COMMANDES FOURNISSEURS & RÉCEPTIONS */}
      {activeSubTab === 'inv_orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
            <div>
              <h3 className="font-bold text-sm text-white">
                Commandes Fournisseurs & Réceptions Marchandises
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pointez les livraisons reçues contre les quantités commandées pour valider l'entrée en stock.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSupplierModalOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                + Nouveau Fournisseur
              </button>
              <button
                onClick={() => setIsPOModalOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Bon de Commande</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800">
              <h3 className="font-bold text-xs uppercase text-amber-400">
                Suivi des Bons de Commande Fournisseurs
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">N° Commande</th>
                    <th className="px-4 py-3 font-semibold">Fournisseur</th>
                    <th className="px-4 py-3 font-semibold">Articles Commandés</th>
                    <th className="px-4 py-3 font-semibold">Date Émission / Prévue</th>
                    <th className="px-4 py-3 font-semibold text-right">Montant Total</th>
                    <th className="px-4 py-3 font-semibold text-center">Statut</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {state.purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{po.orderNumber}</td>
                      <td className="px-4 py-3 font-medium text-white">{po.supplierName}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="text-[11px]">
                            {it.productName} ({it.receivedQuantity}/{it.orderedQuantity})
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        <div>{po.orderDate}</div>
                        <div className="text-[10px] text-slate-500">Prévu: {po.expectedDeliveryDate}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {formatFCFA(po.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            po.status === 'received'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : po.status === 'partially_received'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                          }`}
                        >
                          {po.status === 'received'
                            ? 'Livrée Complète'
                            : po.status === 'partially_received'
                            ? 'Partiellement Reçue'
                            : 'En Attente Livraison'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {po.status !== 'received' && (
                          <button
                            onClick={() => handleStartReception(po)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] cursor-pointer"
                          >
                            Réceptionner
                          </button>
                        )}
                        {po.status === 'received' && (
                          <span className="text-[11px] text-slate-500 italic">Réceptionnée</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB D: INVENTAIRE PHYSIQUE */}
      {activeSubTab === 'inv_audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white">
              Procédure d'Inventaire Physique Périodique
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              L'inventaire physique consiste à dénombrer les articles en rayon et en réserve. Chaque écart entre le stock théorique et le comptage physique réel est tracé dans l'historique et notifié au comptable et à l'administrateur.
            </p>
            <button
              onClick={() => setIsInventoryCountModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              Lancer une Saisie de Comptage d'Inventaire
            </button>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Ajouter un Nouvel Article au Catalogue
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Désignation du produit :</label>
                <input
                  type="text"
                  placeholder="Ex: Riz Parfumé Jasmin 5kg"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-medium text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Code-barres EAN :</label>
                  <input
                    type="text"
                    placeholder="Ex: 600100999999"
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Référence Interne :</label>
                  <input
                    type="text"
                    placeholder="Ex: EP-RIZ-05K"
                    value={newProdRef}
                    onChange={(e) => setNewProdRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Rayon / Catégorie :</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="Épicerie">Épicerie</option>
                    <option value="Boissons">Boissons</option>
                    <option value="Produits Frais & Laiterie">Produits Frais & Laiterie</option>
                    <option value="Hygiène & Entretien">Hygiène & Entretien</option>
                    <option value="Boulangerie & Snacks">Boulangerie & Snacks</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unité de vente :</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white capitalize"
                  >
                    <option value="pièce">Pièce / Unité</option>
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="paquet">Paquet</option>
                    <option value="bouteille">Bouteille</option>
                    <option value="carton">Carton</option>
                    <option value="sachet">Sachet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Stock Initial Reçu :</label>
                  <input
                    type="number"
                    value={newProdInitialStock}
                    onChange={(e) => setNewProdInitialStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Seuil d'Alerte Minimum :</label>
                  <input
                    type="number"
                    value={newProdAlertThreshold}
                    onChange={(e) => setNewProdAlertThreshold(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Prix Achat Indicatif (FCFA) :</label>
                  <input
                    type="number"
                    value={newProdPurchasePrice}
                    onChange={(e) => setNewProdPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">N° Lot :</label>
                  <input
                    type="text"
                    value={newProdLot}
                    onChange={(e) => setNewProdLot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Date Limite de Péremption (DLC) :</label>
                <input
                  type="date"
                  value={newProdExpiry}
                  onChange={(e) => setNewProdExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveNewProduct}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg"
              >
                Enregistrer l'Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Modifier la Fiche Article : {editingProduct.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nom :</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Code-barres :</label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Seuil Alerte :</label>
                  <input
                    type="number"
                    value={editingProduct.alertThreshold}
                    onChange={(e) => setEditingProduct({ ...editingProduct, alertThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">N° Lot :</label>
                  <input
                    type="text"
                    value={editingProduct.lotNumber}
                    onChange={(e) => setEditingProduct({ ...editingProduct, lotNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Péremption :</label>
                  <input
                    type="date"
                    value={editingProduct.expiryDate}
                    onChange={(e) => setEditingProduct({ ...editingProduct, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProductEdit}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOSS / BREAKAGE MODAL */}
      {isLossModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 text-red-400">
              <ArrowDownCircle className="w-5 h-5" />
              <span>Déclaration de Perte, Casse ou Produit Périmé</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Article Concerné :</label>
                <select
                  value={lossProductId}
                  onChange={(e) => setLossProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Sélectionnez un article</option>
                  {state.products.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quantité Perdue / Avariée :</label>
                <input
                  type="number"
                  min="1"
                  value={lossQty}
                  onChange={(e) => setLossQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Motif Obligatoire de la Perte :
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Bouteille cassée lors de la mise en rayon..."
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsLossModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveLoss}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg"
              >
                Valider la Perte & Sortir du Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHYSICAL INVENTORY COUNT MODAL */}
      {isInventoryCountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 text-cyan-400">
              <ClipboardList className="w-5 h-5" />
              <span>Ajustement d'Inventaire Physique</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Article :</label>
                <select
                  value={invCountProductId}
                  onChange={(e) => {
                    setInvCountProductId(e.target.value);
                    const prod = state.products.find((p) => p.id === e.target.value);
                    if (prod) setInvCountActualStock(prod.currentStock);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Sélectionnez un article</option>
                  {state.products.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Théorique: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Quantité Réelle Constatée en Rayon :
                </label>
                <input
                  type="number"
                  value={invCountActualStock}
                  onChange={(e) => setInvCountActualStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-sm text-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Justification de l'Écart :
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Comptage physique hebdomadaire..."
                  value={invCountJustification}
                  onChange={(e) => setInvCountJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsInventoryCountModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveInventoryCount}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg"
              >
                Ajuster le Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PURCHASE ORDER MODAL */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Préparer un Bon de Commande Fournisseur
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Fournisseur :</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Sélectionnez un fournisseur</option>
                  {state.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Article à Réapprovisionner :</label>
                <select
                  value={poProductId}
                  onChange={(e) => setPoProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Sélectionnez un article</option>
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantité à Commander :</label>
                  <input
                    type="number"
                    min="1"
                    value={poQty}
                    onChange={(e) => setPoQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Date Livraison Prévue :</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePO}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg"
              >
                Émettre le Bon de Commande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEPTION MODAL */}
      {receivingPO && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Réception de Marchandises : {receivingPO.orderNumber}
            </h3>
            <p className="text-xs text-slate-400">
              Fournisseur : <strong className="text-amber-400">{receivingPO.supplierName}</strong>. Pointez les quantités réellement déchargées.
            </p>

            <div className="space-y-3 text-xs divide-y divide-slate-800">
              {receivingPO.items.map((item) => (
                <div key={item.productId} className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white">{item.productName}</span>
                    <div className="text-[11px] text-slate-400">
                      Commandé : {item.orderedQuantity} unités
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Reçu réel :</label>
                    <input
                      type="number"
                      min="0"
                      value={receivedQuantities[item.productId] ?? item.orderedQuantity}
                      onChange={(e) =>
                        setReceivedQuantities({
                          ...receivedQuantities,
                          [item.productId]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded font-mono font-bold text-center text-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-xs text-slate-400 block mb-1">Notes de Réception :</label>
              <textarea
                rows={2}
                value={receptionNotes}
                onChange={(e) => setReceptionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setReceivingPO(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReception}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-lg"
              >
                Valider l'Entrée en Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Ajouter un Fournisseur
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Raison Sociale :</label>
                <input
                  type="text"
                  placeholder="Ex: SOBOA / Suneor"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Téléphone de Contact :</label>
                <input
                  type="text"
                  placeholder="+221 33 800 00 00"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Catégorie :</label>
                <input
                  type="text"
                  placeholder="Ex: Boissons / Épicerie"
                  value={newSupCategory}
                  onChange={(e) => setNewSupCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSupplier}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
