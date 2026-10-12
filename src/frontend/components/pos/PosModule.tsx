import React, { useState, useMemo } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Smartphone,
  Printer,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  User,
  X,
  Lock,
  ArrowRight,
  ShieldAlert,
  Package,
} from 'lucide-react';
import { Product, SaleItem, PaymentMethod, Sale, CashSession } from '../../../types';
import { store, formatFCFA } from '../../../services/store';
import { ReceiptModal } from '../print/ReceiptModal';

interface PosModuleProps {
  activeSubTab?: 'pos_terminal' | 'pos_history' | 'pos_session';
}

export const PosModule: React.FC<PosModuleProps> = ({ activeSubTab = 'pos_terminal' }) => {
  const state = store.getState();
  const currentUser = store.getCurrentUser();
  const activeSession = state.cashSessions.find((s) => s.id === state.activeCashSessionId && s.status === 'open');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [mobilePosView, setMobilePosView] = useState<'catalog' | 'cart'>('catalog');
  const [saleType, setSaleType] = useState<'definitive' | 'proforma'>('definitive');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('especes');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Receipt Modal
  const [selectedSaleToPrint, setSelectedSaleToPrint] = useState<Sale | null>(null);

  // Cash Session Modal (Open / Close)
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>('25000');
  const [registerNameInput, setRegisterNameInput] = useState<string>('Caisse 01 - Principale');
  const [closingRealCountInput, setClosingRealCountInput] = useState<string>('');
  const [closingNotesInput, setClosingNotesInput] = useState<string>('');

  // Cancellation Request Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    state.products.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [state.products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return state.products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [state.products, searchTerm, selectedCategory]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.total, 0);
  }, [cart]);

  const cartTotalVAT = useMemo(() => {
    return cart.reduce((acc, it) => {
      const ht = it.total / (1 + it.vatRate / 100);
      return acc + (it.total - ht);
    }, 0);
  }, [cart]);

  const cartTotalDiscounts = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.discountAmount, 0);
  }, [cart]);

  // Add product to cart with active promotions applied
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert(`L'article ${product.name} est en rupture de stock !`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((it) => it.productId === product.id);
      const newQty = existing ? existing.quantity + 1 : 1;

      if (newQty > product.currentStock) {
        alert(`Stock insuffisant ! Disponible : ${product.currentStock} ${product.unit}`);
        return prev;
      }

      // Check for active promotions
      const activePromo = state.promotions.find(
        (p) =>
          p.isActive &&
          (p.productId === product.id || p.category === product.category) &&
          new Date(p.startDate) <= new Date() &&
          new Date(p.endDate) >= new Date()
      );

      let discountPerUnit = 0;
      if (activePromo && newQty >= activePromo.minQuantity) {
        if (activePromo.type === 'percentage') {
          discountPerUnit = (product.sellingPrice * activePromo.value) / 100;
        } else if (activePromo.type === 'fixed_discount') {
          discountPerUnit = activePromo.value;
        }
      }

      const totalItemDiscount = discountPerUnit * newQty;
      const totalItemPrice = Math.max(0, product.sellingPrice * newQty - totalItemDiscount);

      if (existing) {
        return prev.map((it) =>
          it.productId === product.id
            ? {
                ...it,
                quantity: newQty,
                discountAmount: totalItemDiscount,
                total: totalItemPrice,
              }
            : it
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            barcode: product.barcode,
            name: product.name,
            unit: product.unit,
            unitPrice: product.sellingPrice,
            purchasePriceAtSale: product.purchasePrice,
            vatRate: product.vatRate,
            quantity: 1,
            discountAmount: totalItemDiscount,
            total: totalItemPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((it) => it.productId === productId);
      const prod = state.products.find((p) => p.id === productId);
      if (!item || !prod) return prev;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((it) => it.productId !== productId);
      }
      if (newQty > prod.currentStock) {
        alert(`Quantité maximale en stock atteinte (${prod.currentStock})`);
        return prev;
      }

      // Recompute promo discount
      const activePromo = state.promotions.find(
        (p) =>
          p.isActive &&
          (p.productId === prod.id || p.category === prod.category) &&
          new Date(p.startDate) <= new Date() &&
          new Date(p.endDate) >= new Date()
      );

      let discountPerUnit = 0;
      if (activePromo && newQty >= activePromo.minQuantity) {
        if (activePromo.type === 'percentage') {
          discountPerUnit = (prod.sellingPrice * activePromo.value) / 100;
        } else if (activePromo.type === 'fixed_discount') {
          discountPerUnit = activePromo.value;
        }
      }

      const totalItemDiscount = discountPerUnit * newQty;
      const totalItemPrice = Math.max(0, prod.sellingPrice * newQty - totalItemDiscount);

      return prev.map((it) =>
        it.productId === productId
          ? {
              ...it,
              quantity: newQty,
              discountAmount: totalItemDiscount,
              total: totalItemPrice,
            }
          : it
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Process checkout
  const handleOpenPayment = (type: 'definitive' | 'proforma') => {
    if (cart.length === 0) {
      alert('Veuillez ajouter au moins un article dans le panier.');
      return;
    }
    if (type === 'definitive' && !activeSession) {
      alert('Veuillez ouvrir une session de caisse avant d encaisser des ventes définitives.');
      setIsOpenSessionModalOpen(true);
      return;
    }

    setSaleType(type);
    setAmountReceived(type === 'proforma' ? '0' : String(cartSubtotal));
    setIsPaymentModalOpen(true);
  };

  const handleConfirmSale = () => {
    const received = parseFloat(amountReceived) || 0;

    if (saleType === 'definitive') {
      if (paymentMethod === 'credit') {
        if (!state.config.allowCreditSales) {
          alert('Les ventes à crédit ne sont pas activées par la direction.');
          return;
        }
        if (!customerName) {
          alert('Le nom du client est obligatoire pour une vente à crédit.');
          return;
        }
      } else {
        if (received < cartSubtotal) {
          alert(`Montant insuffisant ! Le total est de ${formatFCFA(cartSubtotal)}.`);
          return;
        }
      }
    }

    const newSale = store.processSale({
      type: saleType,
      items: cart,
      paymentMethod,
      amountPaid: saleType === 'proforma' ? 0 : Math.min(cartSubtotal, received),
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      notes: saleNotes || undefined,
    });

    setIsPaymentModalOpen(false);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setSaleNotes('');

    // Open printable receipt automatically
    setSelectedSaleToPrint(newSale);
  };

  // Open / Close session handlers
  const handleOpenSession = () => {
    const amount = parseFloat(openingBalanceInput) || 0;
    store.openCashSession(registerNameInput, amount);
    setIsOpenSessionModalOpen(false);
  };

  const handleCloseSession = () => {
    if (!activeSession) return;
    const realAmount = parseFloat(closingRealCountInput) || 0;
    store.closeCashSession(activeSession.id, realAmount, closingNotesInput);
    setIsCloseSessionModalOpen(false);
    setClosingRealCountInput('');
    setClosingNotesInput('');
  };

  // Cancellation Request
  const handleRequestCancellation = (sale: Sale) => {
    setSaleToCancel(sale);
    setCancellationReason('');
    setIsCancelModalOpen(true);
  };

  const submitCancellation = () => {
    if (!saleToCancel || !cancellationReason.trim()) {
      alert('Veuillez indiquer le motif obligatoire de l annulation.');
      return;
    }
    store.requestSaleCancellation(saleToCancel.id, cancellationReason);
    setIsCancelModalOpen(false);
    setSaleToCancel(null);
    setCancellationReason('');
    alert('Demande d annulation transmise pour validation au Super Administrateur.');
  };

  // Cash change calculation
  const cashChange = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - cartSubtotal);
  }, [amountReceived, cartSubtotal]);

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Session Alert / Status Banner */}
      {!activeSession ? (
        <div className="p-4 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-200">
                Session de Caisse Fermée
              </p>
              <p className="text-xs text-amber-300/80">
                Vous devez ouvrir votre session avec un fond de caisse avant de pouvoir enregistrer des ventes définitives.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenSessionModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-md"
          >
            Ouvrir ma Session
          </button>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30"></span>
            <div>
              <span className="text-xs font-bold text-white">
                {activeSession.registerNumber}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                Ouverte à {new Date(activeSession.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-xs text-slate-400 pl-3 border-l border-slate-700">
              Fond initial: <span className="font-mono font-bold text-amber-400">{formatFCFA(activeSession.openingBalance)}</span>
            </div>
            <div className="text-xs text-slate-400 pl-3 border-l border-slate-700">
              Ventes session: <span className="font-mono font-bold text-cyan-400">{formatFCFA(activeSession.totalSalesAmount)}</span> ({activeSession.salesCount} tickets)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCloseSessionModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-red-300 hover:text-white hover:bg-red-950/60 border border-red-800/60 rounded-lg transition-colors cursor-pointer"
            >
              Clôturer la Caisse
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: TERMINAL DE CAISSE */}
      {activeSubTab === 'pos_terminal' && (
        <div className="space-y-4">
          
          {/* Mobile Screen (< lg) Segmented Switcher */}
          <div className="lg:hidden flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-md">
            <button
              onClick={() => setMobilePosView('catalog')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mobilePosView === 'catalog'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Rayons & Scan ({filteredProducts.length})</span>
            </button>

            <button
              onClick={() => setMobilePosView('cart')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                mobilePosView === 'cart'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>
                Panier ({cart.reduce((a, b) => a + b.quantity, 0)}) · {formatFCFA(cartSubtotal)}
              </span>
              {cart.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 animate-ping" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: PRODUCT SELECTION (7 COLS) */}
            <div className={`space-y-4 lg:col-span-7 ${mobilePosView === 'cart' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Search & Quick Barcode Input */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Scanner un code-barres ou rechercher par nom, réf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-24 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-100 placeholder:text-slate-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                  <Barcode className="w-4 h-4" />
                  <span>Scanner</span>
                </div>
              </div>

              {/* Fast Barcode Selector Simulation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] text-slate-400 uppercase font-semibold whitespace-nowrap">
                  Code-barres rapides :
                </span>
                {state.products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSearchTerm(p.barcode);
                      addToCart(p);
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/50 border border-slate-800 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer text-slate-300"
                  >
                    {p.name.split(' ')[0]} ({p.barcode.slice(-4)})
                  </button>
                ))}
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cat === 'all' ? 'Tous les rayons' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((prod) => {
                const isLowStock = prod.currentStock <= prod.alertThreshold;
                const isOutOfStock = prod.currentStock <= 0;
                const promo = state.promotions.find((pr) => pr.isActive && pr.productId === prod.id);

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    className={`p-3 bg-slate-900/90 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isOutOfStock
                        ? 'opacity-40 border-slate-800 cursor-not-allowed'
                        : 'border-slate-800 hover:border-amber-400 hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-mono">{prod.reference}</span>
                        {promo && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-600/40 px-1.5 py-0.5 rounded">
                            -{promo.value}{promo.type === 'percentage' ? '%' : ' F'}
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-white text-xs line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {prod.barcode}
                      </p>

                      {/* Sector Specific Badges */}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {prod.requiresPrescription && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                            Ordonnance Req.
                          </span>
                        )}
                        {prod.lotNumber && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {prod.lotNumber}
                          </span>
                        )}
                        {prod.technicalSpecs && (
                          <span className="text-[9px] font-medium px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 truncate max-w-[140px]" title={prod.technicalSpecs}>
                            {prod.technicalSpecs.slice(0, 22)}...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold font-mono text-amber-400">
                          {formatFCFA(prod.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          TVA {prod.vatRate}%
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            isOutOfStock
                              ? 'text-red-400'
                              : isLowStock
                              ? 'text-yellow-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                        </span>
                        <div className="text-[10px] text-slate-500">en rayon</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-slate-900/90 p-8 rounded-xl border border-slate-800 text-center">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">Aucun article trouvé</p>
                <p className="text-xs text-slate-500 mt-1">
                  Essayez un autre mot-clé ou vérifiez le code-barres scanné.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: ACTIVE CART & CHECKOUT (5 COLS) */}
          <div className={`lg:col-span-5 bg-slate-900/95 rounded-xl border border-slate-800 shadow-2xl overflow-hidden sticky top-20 ${
            mobilePosView === 'catalog' ? 'hidden lg:block' : 'block'
          }`}>
            
            {/* Cart Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs tracking-wide">
                  PANIER EN COURS ({cart.reduce((a, b) => a + b.quantity, 0)} articles)
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-4 max-h-[380px] overflow-y-auto divide-y divide-slate-800/80">
              {cart.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-amber-300">{formatFCFA(item.unitPrice)}</span>
                      <span>·</span>
                      <span className="text-[10px]">TVA {item.vatRate}%</span>
                      {item.discountAmount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400 font-medium">
                            Remise -{formatFCFA(item.discountAmount)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-mono font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right shrink-0 w-24">
                    <span className="font-mono font-bold text-amber-400">
                      {formatFCFA(item.total)}
                    </span>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                  <p className="text-xs">Le panier est vide</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scannez un code-barres ou cliquez sur un article pour l'ajouter.
                  </p>
                </div>
              )}
            </div>

            {/* Cart Calculation Breakdown */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Brut HT :</span>
                <span className="font-mono">{formatFCFA(cartSubtotal - cartTotalVAT)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TVA (18% / Exonéré) :</span>
                <span className="font-mono">{formatFCFA(cartTotalVAT)}</span>
              </div>
              {cartTotalDiscounts > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Remises déduites :</span>
                  <span className="font-mono">-{formatFCFA(cartTotalDiscounts)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>NET À PAYER :</span>
                <span className="font-mono text-amber-400 text-lg">
                  {formatFCFA(cartSubtotal)}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nom Client (ex: Comptoir)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Téléphone / Mobile"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Actions: Facture Proforma vs Encaisser Vente Définitive */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenPayment('proforma')}
                disabled={cart.length === 0}
                className="px-3 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Facture Proforma</span>
              </button>

              <button
                onClick={() => handleOpenPayment('definitive')}
                disabled={cart.length === 0 || !activeSession}
                className="px-3 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Encaisser Vente</span>
              </button>
            </div>

          </div>

        </div>

        {/* Floating Mobile Cart Bar when viewing catalog (< lg) */}
        {mobilePosView === 'catalog' && cart.length > 0 && (
          <div className="lg:hidden sticky bottom-4 z-30 p-3 bg-gradient-to-r from-slate-950 via-[#0a1428] to-[#121c38] border border-amber-400/60 rounded-2xl shadow-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-300 block">
                {cart.reduce((a, b) => a + b.quantity, 0)} article(s) dans le panier
              </span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {formatFCFA(cartSubtotal)}
              </span>
            </div>
            <button
              onClick={() => setMobilePosView('cart')}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Voir Panier & Payer</span>
            </button>
          </div>
        )}

      </div>
    )}

      {/* SUB-TAB 2: HISTORIQUE DES VENTES */}
      {activeSubTab === 'pos_history' && (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">
                Historique des Ventes & Factures
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Consultez vos transactions, réimprimez les tickets ou demandez une annulation autorisée.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 font-mono">
              Total {state.sales.length} factures
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">N° Facture</th>
                  <th className="px-4 py-3 font-semibold">Date & Heure</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Mode Règlement</th>
                  <th className="px-4 py-3 font-semibold text-right">Montant Total</th>
                  <th className="px-4 py-3 font-semibold text-center">Statut</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {state.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(sale.date).toLocaleDateString('fr-FR')} {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {sale.customerName || 'Comptoir'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium ${
                        sale.type === 'proforma' ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {sale.type === 'proforma' ? 'Proforma' : 'Définitive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium uppercase text-slate-400">
                      {sale.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {formatFCFA(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sale.status === 'completed'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                          : sale.status === 'refund_requested'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                          : 'bg-red-950/80 text-red-400 border border-red-800/40'
                      }`}>
                        {sale.status === 'completed'
                          ? 'Validée'
                          : sale.status === 'refund_requested'
                          ? 'Annulation en attente'
                          : 'Annulée'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSaleToPrint(sale)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                          title="Imprimer le ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {sale.type === 'definitive' && sale.status === 'completed' && (
                          <button
                            onClick={() => handleRequestCancellation(sale)}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/50 rounded cursor-pointer"
                            title="Demander une annulation"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GESTION DE LA SESSION DE CAISSE */}
      {activeSubTab === 'pos_session' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white">
              Session Actuelle de Caisse
            </h3>
            {activeSession ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Caissier(e) en poste :</span>
                  <span className="font-semibold text-white">{activeSession.cashierName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Caisse assignée :</span>
                  <span className="font-semibold text-white">{activeSession.registerNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Heure d'ouverture :</span>
                  <span className="font-mono text-white">
                    {new Date(activeSession.openedAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Fond de caisse initial :</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatFCFA(activeSession.openingBalance)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Nombre de ventes validées :</span>
                  <span className="font-mono font-bold text-white">{activeSession.salesCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total des ventes enregistrées :</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {formatFCFA(activeSession.totalSalesAmount)}
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setIsCloseSessionModalOpen(true)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    Procéder à la Clôture de Caisse & Calculer l'Écart
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">Aucune session active</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ouvrez une session avec un fond de caisse pour commencer vos opérations.
                </p>
                <button
                  onClick={() => setIsOpenSessionModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Ouvrir une Session
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white">
              Règles de Caisse & Sécurité
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <p className="font-semibold text-amber-400">Verrouillage des Prix & TVA</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Conformément au règlement du supermarché, vous ne pouvez pas modifier directement le prix unitaire, le taux de TVA ou les promotions. C'est le rôle exclusif du Comptable.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <p className="font-semibold text-amber-400">Interdiction de Suppression Silencieuse</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Une vente définitive validée ne peut être effacée. Toute annulation nécessite une demande formelle transmise au Super Administrateur.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <p className="font-semibold text-amber-400">Contrôle des Écarts de Caisse</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  À la clôture, le montant réel compté est comparé au montant théorique. Les écarts sont enregistrés automatiquement dans le journal du comptable.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">
                {saleType === 'proforma' ? 'Validation Facture Proforma' : 'Encaissement de la Vente'}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">Montant Total à Régler :</span>
              <span className="font-mono text-base font-black text-amber-400">
                {formatFCFA(cartSubtotal)}
              </span>
            </div>

            {saleType === 'definitive' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Mode de Règlement :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'especes', label: 'Espèces', icon: DollarSign },
                    { id: 'wave', label: 'Wave', icon: Smartphone },
                    { id: 'orange_money', label: 'OM / MoMo', icon: Smartphone },
                    { id: 'carte', label: 'Carte Bancaire', icon: CreditCard },
                    { id: 'credit', label: 'À Crédit', icon: Clock },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Cash Calculator */}
                {paymentMethod === 'especes' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs text-slate-400 block">
                      Montant Remis par le Client (FCFA) :
                    </label>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg font-mono text-white focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-400">Monnaie à Rendre :</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatFCFA(cashChange)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Credit Sale Warning */}
                {paymentMethod === 'credit' && (
                  <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-lg text-xs text-amber-300 space-y-1">
                    <p className="font-semibold">Vente à Crédit / Paiement Partiel</p>
                    <p className="text-[11px] text-slate-400">
                      Acompte minimum ou crédit total autorisé sous réserve d'identification du client.
                    </p>
                    <div className="pt-2">
                      <label className="text-[11px] block text-amber-300 font-medium">
                        Acompte Versé Immédiatement (FCFA) :
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-amber-500/50 rounded text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSale}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg transition-colors cursor-pointer shadow-md"
              >
                {saleType === 'proforma' ? 'Générer la Proforma' : 'Valider & Imprimer Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPEN CASH SESSION MODAL */}
      {isOpenSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Ouverture de Session de Caisse
            </h3>
            <p className="text-xs text-slate-400">
              Saisissez le fond de caisse physique présent dans le tiroir au démarrage.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Désignation de la caisse :</label>
                <input
                  type="text"
                  value={registerNameInput}
                  onChange={(e) => setRegisterNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Fond de caisse initial (FCFA) :</label>
                <input
                  type="number"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-amber-400 font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsOpenSessionModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleOpenSession}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg"
              >
                Ouvrir la Caisse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE CASH SESSION MODAL */}
      {isCloseSessionModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">
              Clôture de Caisse & Bilan
            </h3>
            <p className="text-xs text-slate-400">
              Comptage physique des espèces pour calcul de l'écart de caisse.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Fond de caisse initial :</span>
                <span className="font-mono font-medium text-white">{formatFCFA(activeSession.openingBalance)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total ventes enregistrées :</span>
                <span className="font-mono font-medium text-cyan-400">{formatFCFA(activeSession.totalSalesAmount)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Espèces réelles comptées dans le tiroir (FCFA) :
                </label>
                <input
                  type="number"
                  placeholder="Ex: 68450"
                  value={closingRealCountInput}
                  onChange={(e) => setClosingRealCountInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-sm text-amber-400 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Observations / Justification :</label>
                <textarea
                  rows={2}
                  placeholder="Commentaires éventuels sur les écarts constatés..."
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsCloseSessionModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCloseSession}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg"
              >
                Confirmer la Clôture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION REQUEST MODAL */}
      {isCancelModalOpen && saleToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-slate-100">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">
                Demande d'Annulation de Facture
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pour des raisons de contrôle financier et de sécurité des stocks, l'annulation de la facture <strong className="font-mono text-amber-400">{saleToCancel.invoiceNumber}</strong> ({formatFCFA(saleToCancel.totalAmount)}) nécessite l'approbation du Super Administrateur.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-semibold block">
                Motif détaillé de l'annulation (obligatoire) :
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Le client n'a pas pu payer, marchandise remise en rayon..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={submitCancellation}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
              >
                Transmettre pour Validation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      <ReceiptModal
        sale={selectedSaleToPrint}
        config={state.config}
        isOpen={Boolean(selectedSaleToPrint)}
        onClose={() => setSelectedSaleToPrint(null)}
      />

    </div>
  );
};
