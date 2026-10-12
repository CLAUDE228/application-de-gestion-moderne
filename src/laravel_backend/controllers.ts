/**
 * LARAVEL CONTROLLERS
 * Emulation of App/Http/Controllers/...
 * Encapsulating business logic: ArticleController, PricingController, PosController, AccountingController
 */

import { store } from '../services/store';
import { Product } from '../types';

export class ArticleController {
  public static index(): Product[] {
    return store.getState().products;
  }

  public static show(id: string): Product | undefined {
    return store.getState().products.find((p) => p.id === id);
  }

  /**
   * OÙ SONT DÉFINIS LES PRIX DES ARTICLES ?
   * C'est ici, via le PricingController et l'espace Comptable / Super Admin !
   */
  public static updatePriceAndTaxes(
    productId: string,
    sellingPrice: number,
    vatRate: number,
    purchasePrice?: number
  ) {
    store.updatePricing(productId, sellingPrice, vatRate, purchasePrice);
  }
}

export class PosController {
  public static processSale(payload: Parameters<typeof store.processSale>[0]) {
    return store.processSale(payload);
  }

  public static openSession(registerName: string, openingAmount: number) {
    return store.openCashSession(registerName, openingAmount);
  }

  public static closeSession(sessionId: string, realCash: number, notes?: string) {
    return store.closeCashSession(sessionId, realCash, notes);
  }
}

export class AccountingController {
  public static getFinancialBalance() {
    const state = store.getState();
    const sales = state.sales.filter((s) => s.type === 'definitive' && s.status === 'completed');
    const revenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const cogs = sales.reduce(
      (acc, s) => acc + s.items.reduce((sum, it) => sum + it.purchasePriceAtSale * it.quantity, 0),
      0
    );
    const margin = revenue - cogs;
    const expenses = state.expenses.reduce((acc, e) => acc + e.amount, 0);
    const netResult = margin - expenses;

    return {
      revenue,
      cogs,
      margin,
      expenses,
      netResult,
      isSurplus: netResult > 50000,
      isBalanced: netResult >= -20000 && netResult <= 50000,
      isDeficit: netResult < -20000,
    };
  }
}
