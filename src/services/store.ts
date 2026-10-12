import {
  User,
  UserRole,
  Product,
  Promotion,
  Sale,
  CashSession,
  Supplier,
  PurchaseOrder,
  StockMovement,
  OperatingExpense,
  Message,
  AuditLog,
  ApprovalRequest,
  SupermarketConfig,
  BusinessSector,
} from '../types';

import {
  INITIAL_CONFIG,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_CASH_SESSION,
  INITIAL_SALES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_OPERATING_EXPENSES,
  INITIAL_MESSAGES,
  INITIAL_AUDIT_LOGS,
  INITIAL_APPROVAL_REQUESTS,
  PHARMACY_CONFIG,
  PHARMACY_PRODUCTS,
  BTP_CONFIG,
  BTP_PRODUCTS,
} from './mockData';

const STORAGE_KEY = 'supermarche_erp_v1';

export interface AppState {
  config: SupermarketConfig;
  users: User[];
  currentUserId: string;
  products: Product[];
  promotions: Promotion[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  cashSessions: CashSession[];
  activeCashSessionId?: string;
  sales: Sale[];
  stockMovements: StockMovement[];
  expenses: OperatingExpense[];
  messages: Message[];
  auditLogs: AuditLog[];
  approvalRequests: ApprovalRequest[];
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure essential fields exist
      if (parsed.products && parsed.sales && parsed.users) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load from localStorage, initializing fresh state', err);
  }

  return {
    config: INITIAL_CONFIG,
    users: INITIAL_USERS,
    currentUserId: INITIAL_USERS[0].id, // Default to cashier
    products: INITIAL_PRODUCTS,
    promotions: INITIAL_PROMOTIONS,
    suppliers: INITIAL_SUPPLIERS,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
    cashSessions: [INITIAL_CASH_SESSION],
    activeCashSessionId: INITIAL_CASH_SESSION.id,
    sales: INITIAL_SALES,
    stockMovements: INITIAL_STOCK_MOVEMENTS,
    expenses: INITIAL_OPERATING_EXPENSES,
    messages: INITIAL_MESSAGES,
    auditLogs: INITIAL_AUDIT_LOGS,
    approvalRequests: INITIAL_APPROVAL_REQUESTS,
  };
}

// Global Singleton State with Subscribers
class StoreManager {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = loadInitialState();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('LocalStorage save failed', e);
    }
    this.listeners.forEach((fn) => fn());
  }

  // --- CURRENT USER & ROLE SWITCHER ---
  public getCurrentUser(): User {
    const user = this.state.users.find((u) => u.id === this.state.currentUserId);
    return user || this.state.users[0];
  }

  public setCurrentUser(userId: string) {
    const user = this.state.users.find((u) => u.id === userId);
    if (user) {
      this.state.currentUserId = userId;
      this.logAudit(
        'Connexion / Changement d utilisateur',
        'admin',
        `Utilisateur actif passé à ${user.name} (${user.role})`
      );
      this.notify();
    }
  }

  public switchRole(role: UserRole) {
    const target = this.state.users.find((u) => u.role === role);
    if (target) {
      this.setCurrentUser(target.id);
    }
  }

  // --- AUDIT LOG ---
  public logAudit(
    action: string,
    module: AuditLog['module'],
    details: string,
    severity: AuditLog['severity'] = 'info'
  ) {
    const currentUser = this.getCurrentUser();
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      module,
      details,
      severity,
    };
    this.state.auditLogs = [newLog, ...this.state.auditLogs];
  }

  // --- PRODUCTS & CATALOG (Ravitailleur / Admin) ---
  public addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const currentUser = this.getCurrentUser();
    const newProduct: Product = {
      ...productData,
      id: 'prod_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.products = [newProduct, ...this.state.products];

    // Log stock movement if initial stock > 0
    if (newProduct.currentStock > 0) {
      this.recordStockMovement(
        newProduct.id,
        newProduct.name,
        'reception',
        newProduct.currentStock,
        0,
        newProduct.currentStock,
        'Stock initial à la création du produit',
        'INIT-' + newProduct.reference
      );
    }

    this.logAudit(
      'Création d article au catalogue',
      'stock',
      `Article ${newProduct.name} (Réf: ${newProduct.reference}, Code: ${newProduct.barcode}) créé.`
    );

    this.notify();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>) {
    const prev = this.state.products.find((p) => p.id === productId);
    if (!prev) return;

    const updated = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.state.products = this.state.products.map((p) => (p.id === productId ? updated : p));

    this.logAudit(
      'Mise à jour d article',
      'stock',
      `Article ${prev.name} mis à jour par ${this.getCurrentUser().name}.`
    );

    this.notify();
  }

  public toggleProductStatus(productId: string) {
    const prod = this.state.products.find((p) => p.id === productId);
    if (!prod) return;

    prod.isActive = !prod.isActive;
    prod.updatedAt = new Date().toISOString();

    this.logAudit(
      prod.isActive ? 'Réactivation d article' : 'Archivage / Désactivation d article',
      'stock',
      `Article ${prod.name} ${prod.isActive ? 'réactivé' : 'archivé'}.`
    );

    this.notify();
  }

  // --- PRICE & TAX ADJUSTMENT (Comptable / Super Admin) ---
  public updatePricing(
    productId: string,
    sellingPrice: number,
    vatRate: number,
    purchasePrice?: number
  ) {
    const prod = this.state.products.find((p) => p.id === productId);
    if (!prod) return;

    const oldPrice = prod.sellingPrice;
    const oldVat = prod.vatRate;

    prod.sellingPrice = sellingPrice;
    prod.vatRate = vatRate;
    if (purchasePrice !== undefined) prod.purchasePrice = purchasePrice;
    prod.updatedAt = new Date().toISOString();

    this.logAudit(
      'Modification tarifaire & TVA',
      'comptabilite',
      `Produit ${prod.name}: Prix passé de ${oldPrice} à ${sellingPrice} FCFA (TVA: ${oldVat}% -> ${vatRate}%).`
    );

    // Notify users
    this.sendMessage({
      recipientRole: 'all',
      subject: `Ajustement de Prix : ${prod.name}`,
      body: `Le prix de vente de ${prod.name} a été ajusté à ${sellingPrice} FCFA (TVA: ${vatRate}%).`,
      priority: 'normal',
      relatedItemId: prod.id,
    });

    this.notify();
  }

  // --- PROMOTIONS (Comptable / Super Admin) ---
  public addPromotion(promo: Omit<Promotion, 'id' | 'isApproved'>) {
    const newPromo: Promotion = {
      ...promo,
      id: 'promo_' + Date.now(),
      isApproved: true,
    };

    this.state.promotions = [newPromo, ...this.state.promotions];

    this.logAudit(
      'Création de promotion',
      'comptabilite',
      `Promotion "${newPromo.title}" créée pour le produit/catégorie ${newPromo.productId || newPromo.category}.`
    );

    this.sendMessage({
      recipientRole: 'caissier',
      subject: `Nouvelle promotion active : ${newPromo.title}`,
      body: `Une nouvelle promotion est active sur le système de caisse (${newPromo.value}${
        newPromo.type === 'percentage' ? '%' : ' FCFA'
      }).`,
      priority: 'normal',
    });

    this.notify();
  }

  public togglePromotion(promoId: string) {
    const promo = this.state.promotions.find((p) => p.id === promoId);
    if (!promo) return;

    promo.isActive = !promo.isActive;
    this.notify();
  }

  // --- STOCK MANAGEMENT & MOVEMENTS (Ravitailleur) ---
  public recordStockMovement(
    productId: string,
    productName: string,
    type: StockMovement['type'],
    quantityChange: number,
    previousStock: number,
    newStock: number,
    reason: string,
    referenceNumber: string
  ) {
    const currentUser = this.getCurrentUser();
    const movement: StockMovement = {
      id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      productId,
      productName,
      type,
      quantityChange,
      previousStock,
      newStock,
      date: new Date().toISOString(),
      reason,
      referenceNumber,
      userRole: currentUser.role,
      userName: currentUser.name,
    };

    this.state.stockMovements = [movement, ...this.state.stockMovements];
  }

  public recordLossOrDamage(productId: string, quantity: number, reason: string) {
    const prod = this.state.products.find((p) => p.id === productId);
    if (!prod) return;

    const prevStock = prod.currentStock;
    const newStock = Math.max(0, prevStock - quantity);
    prod.currentStock = newStock;
    prod.updatedAt = new Date().toISOString();

    const ref = 'PERTE-' + Date.now().toString().slice(-6);

    this.recordStockMovement(
      prod.id,
      prod.name,
      'loss_breakage',
      -quantity,
      prevStock,
      newStock,
      reason,
      ref
    );

    this.logAudit(
      'Déclaration de casse / perte / avarie',
      'stock',
      `Perte de ${quantity} ${prod.unit} pour ${prod.name}. Motif: "${reason}". Stock restant: ${newStock}`,
      'warning'
    );

    // If stock became lower than threshold
    if (newStock <= prod.alertThreshold) {
      this.checkAndTriggerStockAlert(prod);
    }

    this.notify();
  }

  public recordInventoryAdjustment(productId: string, actualPhysicalStock: number, justification: string) {
    const prod = this.state.products.find((p) => p.id === productId);
    if (!prod) return;

    const prevStock = prod.currentStock;
    const diff = actualPhysicalStock - prevStock;
    prod.currentStock = actualPhysicalStock;
    prod.updatedAt = new Date().toISOString();

    const ref = 'INV-' + Date.now().toString().slice(-6);

    this.recordStockMovement(
      prod.id,
      prod.name,
      'inventory_adjustment',
      diff,
      prevStock,
      actualPhysicalStock,
      justification,
      ref
    );

    this.logAudit(
      'Ajustement d inventaire physique',
      'stock',
      `Stock de ${prod.name} réajusté de ${prevStock} à ${actualPhysicalStock} (écart: ${diff > 0 ? '+' : ''}${diff}). Justif: "${justification}"`,
      Math.abs(diff) > 10 ? 'warning' : 'info'
    );

    if (actualPhysicalStock <= prod.alertThreshold) {
      this.checkAndTriggerStockAlert(prod);
    }

    this.notify();
  }

  private checkAndTriggerStockAlert(prod: Product) {
    this.sendMessage({
      recipientRole: 'all',
      subject: `ALERTE STOCK : ${prod.name}`,
      body: `Le stock de ${prod.name} est à ${prod.currentStock} ${prod.unit} (Seuil d'alerte configuré: ${prod.alertThreshold}). Un réapprovisionnement urgent est requis !`,
      priority: 'stock_alert',
      relatedItemId: prod.id,
    });
  }

  // --- PURCHASE ORDERS & RECEPTIONS (Ravitailleur / Comptable) ---
  public createPurchaseOrder(
    supplierId: string,
    items: { productId: string; quantity: number; unitCost: number }[],
    expectedDeliveryDate: string
  ) {
    const supplier = this.state.suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const orderNumber = 'BC-' + new Date().getFullYear() + '-' + (this.state.purchaseOrders.length + 101);

    const poItems = items.map((item) => {
      const prod = this.state.products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Article',
        orderedQuantity: item.quantity,
        receivedQuantity: 0,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
      };
    });

    const totalCost = poItems.reduce((acc, it) => acc + it.totalCost, 0);

    const newPO: PurchaseOrder = {
      id: 'po_' + Date.now(),
      orderNumber,
      supplierId,
      supplierName: supplier.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate,
      items: poItems,
      totalCost,
      status: 'pending',
      createdBy: `${this.getCurrentUser().name} (${this.getCurrentUser().role})`,
    };

    this.state.purchaseOrders = [newPO, ...this.state.purchaseOrders];

    this.logAudit(
      'Création Bon de Commande Fournisseur',
      'stock',
      `Bon ${orderNumber} émis auprès de ${supplier.name} pour un montant total de ${totalCost} FCFA.`
    );

    this.sendMessage({
      recipientRole: 'comptable',
      subject: `Nouveau Bon de Commande ${orderNumber}`,
      body: `Commande transmise à ${supplier.name} pour ${totalCost} FCFA. Date prévisionnelle: ${expectedDeliveryDate}.`,
      priority: 'normal',
    });

    this.notify();
    return newPO;
  }

  public receivePurchaseOrder(
    poId: string,
    receivedItems: { productId: string; receivedQuantity: number }[],
    notes?: string
  ) {
    const po = this.state.purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    let allComplete = true;

    receivedItems.forEach((rec) => {
      const item = po.items.find((i) => i.productId === rec.productId);
      if (item) {
        item.receivedQuantity = rec.receivedQuantity;
        if (rec.receivedQuantity < item.orderedQuantity) {
          allComplete = false;
        }

        // Update product stock
        const prod = this.state.products.find((p) => p.id === rec.productId);
        if (prod && rec.receivedQuantity > 0) {
          const prev = prod.currentStock;
          const next = prev + rec.receivedQuantity;
          prod.currentStock = next;
          prod.updatedAt = new Date().toISOString();

          this.recordStockMovement(
            prod.id,
            prod.name,
            'reception',
            rec.receivedQuantity,
            prev,
            next,
            `Réception Fournisseur (${po.supplierName}) - Commande ${po.orderNumber}`,
            po.orderNumber
          );
        }
      }
    });

    po.status = allComplete ? 'received' : 'partially_received';
    po.deliveryDate = new Date().toISOString().split('T')[0];
    po.receptionNotes = notes;

    this.logAudit(
      'Réception de marchandises Fournisseur',
      'stock',
      `Réception effectuée pour la commande ${po.orderNumber} (${po.supplierName}). Statut: ${po.status}.`
    );

    this.sendMessage({
      recipientRole: 'all',
      subject: `Marchandises Réceptionnées : ${po.orderNumber}`,
      body: `La livraison de ${po.supplierName} a été vérifiée et intégrée en stock par ${this.getCurrentUser().name}. Notes: ${notes || 'Conforme'}.`,
      priority: 'normal',
    });

    this.notify();
  }

  // --- CASH SESSIONS (Caissier) ---
  public openCashSession(registerNumber: string, openingBalance: number): CashSession {
    const currentUser = this.getCurrentUser();
    const newSession: CashSession = {
      id: 'sess_' + Date.now(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      registerNumber,
      openedAt: new Date().toISOString(),
      openingBalance,
      status: 'open',
      salesCount: 0,
      totalSalesAmount: 0,
    };

    this.state.cashSessions = [newSession, ...this.state.cashSessions];
    this.state.activeCashSessionId = newSession.id;

    // Update user activeCashSessionId
    currentUser.activeCashSessionId = newSession.id;

    this.logAudit(
      'Ouverture de session de caisse',
      'pos',
      `${currentUser.name} a ouvert la ${registerNumber} avec un fond de caisse de ${openingBalance} FCFA.`
    );

    this.notify();
    return newSession;
  }

  public closeCashSession(sessionId: string, closingBalanceReal: number, notes?: string) {
    const session = this.state.cashSessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Calculate theoretical cash sales
    const cashSalesInSession = this.state.sales
      .filter((s) => s.cashSessionId === sessionId && s.paymentMethod === 'especes' && s.status === 'completed')
      .reduce((sum, s) => sum + s.amountPaid, 0);

    const expectedCash = session.openingBalance + cashSalesInSession;
    const discrepancy = closingBalanceReal - expectedCash;

    session.closedAt = new Date().toISOString();
    session.closingBalanceReal = closingBalanceReal;
    session.expectedCashAmount = expectedCash;
    session.discrepancy = discrepancy;
    session.status = 'closed';
    session.notes = notes;

    if (this.state.activeCashSessionId === sessionId) {
      this.state.activeCashSessionId = undefined;
    }

    const currentUser = this.getCurrentUser();
    currentUser.activeCashSessionId = undefined;

    this.logAudit(
      'Clôture de session de caisse',
      'pos',
      `Caisse clôturée par ${session.cashierName}. Fond initial: ${session.openingBalance} F, Théorique: ${expectedCash} F, Réel compté: ${closingBalanceReal} F, Écart de caisse: ${discrepancy} FCFA (${discrepancy >= 0 ? 'Excédent' : 'Déficit'}).`,
      Math.abs(discrepancy) > 1000 ? 'warning' : 'info'
    );

    // Notify Accountant of closing
    this.sendMessage({
      recipientRole: 'comptable',
      subject: `Clôture de caisse : ${session.registerNumber}`,
      body: `Session de ${session.cashierName} fermée. Montant réel: ${closingBalanceReal} FCFA. Écart constaté: ${discrepancy} FCFA.`,
      priority: Math.abs(discrepancy) > 0 ? 'urgent' : 'normal',
    });

    this.notify();
  }

  // --- SALES & POS (Caissier) ---
  public processSale(saleData: {
    type: Sale['type'];
    items: Sale['items'];
    paymentMethod: Sale['paymentMethod'];
    amountPaid: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }): Sale {
    const currentUser = this.getCurrentUser();
    const activeSession = this.state.cashSessions.find((s) => s.id === this.state.activeCashSessionId);

    const totalAmount = saleData.items.reduce((acc, it) => acc + it.total, 0);
    const subtotalHT = saleData.items.reduce((acc, it) => acc + (it.total / (1 + it.vatRate / 100)), 0);
    const vatTotal = totalAmount - subtotalHT;
    const discountTotal = saleData.items.reduce((acc, it) => acc + it.discountAmount, 0);

    const balanceDue = Math.max(0, totalAmount - saleData.amountPaid);
    const paymentStatus: Sale['paymentStatus'] =
      saleData.type === 'proforma'
        ? 'pending'
        : balanceDue === 0
        ? 'paid'
        : saleData.amountPaid > 0
        ? 'partial'
        : 'pending';

    const invoiceNumber =
      (saleData.type === 'proforma' ? 'PRO-' : 'FAC-') +
      new Date().getFullYear() +
      '-' +
      String(this.state.sales.length + 1044).padStart(6, '0');

    const newSale: Sale = {
      id: 'sale_' + Date.now(),
      invoiceNumber,
      date: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      type: saleData.type,
      items: saleData.items,
      subtotalHT: Math.round(subtotalHT),
      vatTotal: Math.round(vatTotal),
      discountTotal,
      totalAmount,
      amountPaid: saleData.amountPaid,
      balanceDue,
      paymentMethod: saleData.paymentMethod,
      paymentStatus,
      customerName: saleData.customerName || 'Client Comptoir',
      customerPhone: saleData.customerPhone,
      cashSessionId: activeSession?.id,
      status: 'completed',
      notes: saleData.notes,
    };

    // If DEFINITIVE sale, update product stocks and register movement
    if (saleData.type === 'definitive') {
      saleData.items.forEach((item) => {
        const prod = this.state.products.find((p) => p.id === item.productId);
        if (prod) {
          const prevStock = prod.currentStock;
          const nextStock = Math.max(0, prevStock - item.quantity);
          prod.currentStock = nextStock;
          prod.updatedAt = new Date().toISOString();

          this.recordStockMovement(
            prod.id,
            prod.name,
            'sale',
            -item.quantity,
            prevStock,
            nextStock,
            `Vente Caisse - Facture ${invoiceNumber}`,
            invoiceNumber
          );

          // Check if alert threshold reached
          if (nextStock <= prod.alertThreshold) {
            this.checkAndTriggerStockAlert(prod);
          }
        }
      });

      // Update cash session
      if (activeSession) {
        activeSession.salesCount += 1;
        activeSession.totalSalesAmount += totalAmount;
      }

      this.logAudit(
        'Vente définitive enregistrée',
        'pos',
        `Facture ${invoiceNumber} d'un montant de ${totalAmount} FCFA réglée par ${saleData.paymentMethod}.`
      );
    } else {
      this.logAudit(
        'Création de facture proforma',
        'pos',
        `Proforma ${invoiceNumber} créée pour ${saleData.customerName || 'Client'} (${totalAmount} FCFA).`
      );
    }

    this.state.sales = [newSale, ...this.state.sales];
    this.notify();
    return newSale;
  }

  // --- CANCELLATIONS & APPROVAL REQUESTS ---
  public requestSaleCancellation(saleId: string, reason: string) {
    const sale = this.state.sales.find((s) => s.id === saleId);
    if (!sale) return;

    sale.status = 'refund_requested';
    sale.cancellationReason = reason;

    const currentUser = this.getCurrentUser();
    const req: ApprovalRequest = {
      id: 'appr_' + Date.now(),
      type: 'sale_cancellation',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      targetId: sale.id,
      targetLabel: `${sale.invoiceNumber} (${sale.totalAmount} FCFA)`,
      reason,
      amountOrValue: sale.totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.state.approvalRequests = [req, ...this.state.approvalRequests];

    this.logAudit(
      'Demande d annulation de vente',
      'pos',
      `Demande d'annulation soumise pour ${sale.invoiceNumber} par ${currentUser.name}. Motif: "${reason}"`,
      'warning'
    );

    this.sendMessage({
      recipientRole: 'superadmin',
      subject: `Demande d'Annulation : ${sale.invoiceNumber}`,
      body: `${currentUser.name} a demandé l'annulation de la vente ${sale.invoiceNumber} pour un montant de ${sale.totalAmount} FCFA. Motif: ${reason}`,
      priority: 'validation_request',
      actionRequired: true,
    });

    this.notify();
  }

  public resolveApprovalRequest(requestId: string, approve: boolean, reviewerNote?: string) {
    const req = this.state.approvalRequests.find((r) => r.id === requestId);
    if (!req) return;

    const currentUser = this.getCurrentUser();
    req.status = approve ? 'approved' : 'rejected';
    req.reviewedBy = `${currentUser.name} (${currentUser.role})`;
    req.reviewedAt = new Date().toISOString();

    if (req.type === 'sale_cancellation') {
      const sale = this.state.sales.find((s) => s.id === req.targetId);
      if (sale) {
        if (approve) {
          sale.status = 'cancelled';
          // Restore stocks
          sale.items.forEach((item) => {
            const prod = this.state.products.find((p) => p.id === item.productId);
            if (prod) {
              const prev = prod.currentStock;
              const next = prev + item.quantity;
              prod.currentStock = next;
              prod.updatedAt = new Date().toISOString();

              this.recordStockMovement(
                prod.id,
                prod.name,
                'return',
                item.quantity,
                prev,
                next,
                `Annulation de vente validée - ${sale.invoiceNumber}`,
                sale.invoiceNumber
              );
            }
          });

          this.logAudit(
            'Annulation de vente validée',
            'admin',
            `Vente ${sale.invoiceNumber} annulée et stocks restitués. Validé par ${currentUser.name}.`
          );
        } else {
          sale.status = 'completed'; // Revert back
          this.logAudit(
            'Demande d annulation rejetée',
            'admin',
            `Rejet de l'annulation de la vente ${sale.invoiceNumber} par ${currentUser.name}.`
          );
        }
      }
    }

    this.sendMessage({
      recipientRole: 'caissier',
      subject: `Réponse à la demande : ${req.targetLabel}`,
      body: `Votre demande a été ${approve ? 'ACCEPTÉE' : 'REJETÉE'} par ${currentUser.name}. Note: ${reviewerNote || 'Aucune'}`,
      priority: 'normal',
    });

    this.notify();
  }

  // --- EXPENSES (Comptable) ---
  public addExpense(expense: Omit<OperatingExpense, 'id'>) {
    const newExp: OperatingExpense = {
      ...expense,
      id: 'exp_' + Date.now(),
    };

    this.state.expenses = [newExp, ...this.state.expenses];

    this.logAudit(
      'Enregistrement de charge d exploitation',
      'comptabilite',
      `Dépense de ${newExp.amount} FCFA enregistrée (${newExp.label}) - Bénéficiaire: ${newExp.paidTo}.`
    );

    this.notify();
  }

  // --- INTERNAL MESSAGING (Django Channels emulation) ---
  public sendMessage(msg: {
    recipientRole: Message['recipientRole'];
    recipientId?: string;
    subject: string;
    body: string;
    priority?: Message['priority'];
    relatedItemId?: string;
    actionRequired?: boolean;
  }) {
    const sender = this.getCurrentUser();
    const newMsg: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      senderId: sender.id,
      senderName: `${sender.name} (${sender.role})`,
      senderRole: sender.role,
      senderAvatar: sender.avatar,
      recipientRole: msg.recipientRole,
      recipientId: msg.recipientId,
      subject: msg.subject,
      body: msg.body,
      priority: msg.priority || 'normal',
      timestamp: new Date().toISOString(),
      readBy: [sender.id], // Sender has read it
      relatedItemId: msg.relatedItemId,
      actionRequired: msg.actionRequired,
    };

    this.state.messages = [newMsg, ...this.state.messages];
    this.notify();
    return newMsg;
  }

  public markMessageAsRead(messageId: string) {
    const currentUser = this.getCurrentUser();
    const msg = this.state.messages.find((m) => m.id === messageId);
    if (msg && !msg.readBy.includes(currentUser.id)) {
      msg.readBy.push(currentUser.id);
      this.notify();
    }
  }

  // --- SUPPLIERS ---
  public addSupplier(supplier: Omit<Supplier, 'id'>) {
    const newSupplier: Supplier = {
      ...supplier,
      id: 'supp_' + Date.now(),
    };
    this.state.suppliers = [newSupplier, ...this.state.suppliers];
    this.logAudit(
      'Nouveau Fournisseur référencé',
      'stock',
      `Fournisseur ${newSupplier.name} enregistré.`
    );
    this.notify();
  }

  // --- CONFIG ---
  public updateConfig(config: Partial<SupermarketConfig>) {
    this.state.config = { ...this.state.config, ...config };
    this.logAudit('Paramètres généraux mis à jour', 'admin', 'Mise à jour des coordonnées et règles de gestion.');
    this.notify();
  }

  // Switch business sector preset (Supermarché / Pharmacie / BTP)
  public switchSector(sector: BusinessSector) {
    if (sector === 'pharmacie') {
      this.state.config = { ...PHARMACY_CONFIG };
      this.state.products = [...PHARMACY_PRODUCTS];
    } else if (sector === 'btp') {
      this.state.config = { ...BTP_CONFIG };
      this.state.products = [...BTP_PRODUCTS];
    } else {
      this.state.config = { ...INITIAL_CONFIG };
      this.state.products = [...INITIAL_PRODUCTS];
    }
    this.logAudit(
      'Adaptation du secteur d activité',
      'admin',
      `Secteur d activité basculé sur : ${sector.toUpperCase()} (${this.state.config.name})`
    );
    this.notify();
  }

  // Reset to initial seed
  public resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = loadInitialState();
    this.notify();
  }
}

export const store = new StoreManager();

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount)) + ' FCFA';
}
