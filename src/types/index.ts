export type UserRole = 'caissier' | 'comptable' | 'ravitailleur' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  sessionActive: boolean;
  activeCashSessionId?: string;
  phone?: string;
}

export type UnitType =
  | 'pièce'
  | 'kg'
  | 'litre'
  | 'paquet'
  | 'bouteille'
  | 'carton'
  | 'sachet'
  | 'boîte'
  | 'flacon'
  | 'plaquette'
  | 'tonne'
  | 'sac'
  | 'mètre'
  | 'm3'
  | 'rouleau'
  | 'fût';

export type BusinessSector = 'supermarche' | 'pharmacie' | 'btp';

export interface Product {
  id: string;
  barcode: string;
  reference: string;
  name: string;
  category: string;
  unit: UnitType;
  purchasePrice: number; // Prix d'achat HT en FCFA
  sellingPrice: number;  // Prix de vente TTC en FCFA
  vatRate: number;       // e.g. 18 (18%) ou 0 (exonéré)
  currentStock: number;
  alertThreshold: number; // Seuil d'alerte mini
  lotNumber: string;
  expiryDate: string;    // YYYY-MM-DD
  isActive: boolean;
  description?: string;
  imageUrl?: string;
  sector?: BusinessSector;
  requiresPrescription?: boolean; // Pour Pharmacie
  technicalSpecs?: string;        // Pour BTP
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  productId?: string;
  category?: string;
  type: 'percentage' | 'fixed_discount' | 'bundle';
  value: number; // e.g. 10 for 10% or 500 for 500 FCFA
  minQuantity: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  requiresApproval?: boolean;
  isApproved?: boolean;
  createdBy: string;
}

export type PaymentMethod = 'especes' | 'wave' | 'orange_money' | 'mtn_momo' | 'carte' | 'credit';
export type PaymentStatus = 'paid' | 'partial' | 'pending';
export type SaleType = 'definitive' | 'proforma';

export interface SaleItem {
  productId: string;
  barcode: string;
  name: string;
  unit: UnitType;
  unitPrice: number; // Prix unitaire TTC
  purchasePriceAtSale: number;
  vatRate: number;
  quantity: number;
  discountAmount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  cashierId: string;
  cashierName: string;
  type: SaleType;
  items: SaleItem[];
  subtotalHT: number;
  vatTotal: number;
  discountTotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number; // Reste à payer pour ventes à crédit
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName?: string;
  customerPhone?: string;
  cashSessionId?: string;
  status: 'completed' | 'cancelled' | 'refund_requested';
  cancellationReason?: string;
  notes?: string;
}

export interface CashSession {
  id: string;
  cashierId: string;
  cashierName: string;
  registerNumber: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number; // Fond de caisse en FCFA
  closingBalanceReal?: number; // Montant réel compté
  expectedCashAmount?: number; // Montant théorique calculé
  discrepancy?: number; // Écart (réel - théorique)
  status: 'open' | 'closed';
  notes?: string;
  salesCount: number;
  totalSalesAmount: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  productsSuppliedCount: number;
  outstandingBalance: number; // Dettes fournisseurs en FCFA
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryDate?: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'draft' | 'pending' | 'partially_received' | 'received' | 'cancelled';
  createdBy: string;
  receptionNotes?: string;
}

export type StockMovementType = 'reception' | 'sale' | 'loss_breakage' | 'inventory_adjustment' | 'return';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityChange: number; // positif ou négatif
  previousStock: number;
  newStock: number;
  date: string;
  reason: string;
  referenceNumber: string;
  userRole: UserRole;
  userName: string;
}

export interface OperatingExpense {
  id: string;
  date: string;
  category: 'loyer' | 'electricite_eau' | 'salaires' | 'maintenance' | 'emballages' | 'transport' | 'autre';
  label: string;
  amount: number;
  paymentMethod: 'especes' | 'virement' | 'cheque';
  paidTo: string;
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  recipientRole: UserRole | 'all';
  recipientId?: string;
  subject: string;
  body: string;
  priority: 'normal' | 'urgent' | 'stock_alert' | 'validation_request';
  timestamp: string;
  readBy: string[]; // user IDs who have read it
  relatedItemId?: string;
  actionRequired?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'pos' | 'comptabilite' | 'stock' | 'admin' | 'messagerie';
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ApprovalRequest {
  id: string;
  type: 'sale_cancellation' | 'special_discount' | 'stock_adjustment' | 'price_override';
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  targetId: string;
  targetLabel: string;
  reason: string;
  amountOrValue?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface SupermarketConfig {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string; // NINEA / RCCM
  currency: string;  // FCFA
  defaultVatRate: number; // 18%
  allowCreditSales: boolean;
  maxCreditDays: number;
  lowStockGlobalThreshold: number;
  businessSector?: BusinessSector;
}
