/**
 * LARAVEL BACKEND ARCHITECTURE
 * Emulation of Eloquent ORM Models & Migrations
 * App/Models/Article.php, App/Models/Sale.php, App/Models/PurchaseOrder.php, App/Models/CashSession.php
 */

import { Product, Sale, CashSession, PurchaseOrder, Supplier, OperatingExpense } from '../types';

export interface LaravelEloquentArticle extends Product {
  // Eloquent timestamps and relations
  table_name: 'articles';
}

export interface LaravelEloquentSale extends Sale {
  table_name: 'sales';
}

export interface LaravelEloquentPurchaseOrder extends PurchaseOrder {
  table_name: 'purchase_orders';
}

export interface LaravelEloquentCashSession extends CashSession {
  table_name: 'cash_sessions';
}

export interface LaravelEloquentSupplier extends Supplier {
  table_name: 'suppliers';
}

export interface LaravelEloquentExpense extends OperatingExpense {
  table_name: 'operating_expenses';
}
