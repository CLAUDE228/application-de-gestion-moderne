import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  BarChart3,
  Scale,
  Sparkles,
} from 'lucide-react';
import { store, formatFCFA } from '../../../services/store';

interface WeeklyStat {
  weekLabel: string;
  startDate: string;
  endDate: string;
  turnover: number; // Chiffre d'affaires en FCFA
  restockingCost: number; // Dépenses faites pour le ravitaillement en FCFA
  operatingExpenses: number; // Autres charges
  itemsRestocked: number;
  itemsSold: number;
}

export const WeeklyAnalyticsModule: React.FC = () => {
  const state = store.getState();

  // Weekly data over recent 5 weeks
  const weeklyData: WeeklyStat[] = [
    {
      weekLabel: 'Semaine 38 (Mi-Sept)',
      startDate: '14 Sep 2026',
      endDate: '20 Sep 2026',
      turnover: 2850000,
      restockingCost: 1950000,
      operatingExpenses: 120000,
      itemsRestocked: 450,
      itemsSold: 580,
    },
    {
      weekLabel: 'Semaine 39 (Fin-Sept)',
      startDate: '21 Sep 2026',
      endDate: '27 Sep 2026',
      turnover: 3420000,
      restockingCost: 2280000,
      operatingExpenses: 145000,
      itemsRestocked: 520,
      itemsSold: 710,
    },
    {
      weekLabel: 'Semaine 40 (Début Oct)',
      startDate: '28 Sep 2026',
      endDate: '04 Oct 2026',
      turnover: 3950000,
      restockingCost: 2450000,
      operatingExpenses: 350000, // Loyer inclus
      itemsRestocked: 610,
      itemsSold: 830,
    },
    {
      weekLabel: 'Semaine 41 (En cours)',
      startDate: '05 Oct 2026',
      endDate: '12 Oct 2026',
      turnover: 4180000,
      restockingCost: 2720000,
      operatingExpenses: 220000,
      itemsRestocked: 680,
      itemsSold: 940,
    },
    {
      weekLabel: 'Semaine 42 (Prévisionnel)',
      startDate: '13 Oct 2026',
      endDate: '19 Oct 2026',
      turnover: 4500000,
      restockingCost: 2900000,
      operatingExpenses: 180000,
      itemsRestocked: 750,
      itemsSold: 1020,
    },
  ];

  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(3); // Default to current week
  const selectedWeek = weeklyData[selectedWeekIdx];

  // Aggregated totals
  const totalTurnover = weeklyData.reduce((acc, w) => acc + w.turnover, 0);
  const totalRestocking = weeklyData.reduce((acc, w) => acc + w.restockingCost, 0);
  const totalGrossMargin = totalTurnover - totalRestocking;
  const overallMarginRate = Math.round((totalGrossMargin / totalTurnover) * 100);

  // Maximum value for SVG scaling
  const maxVal = Math.max(...weeklyData.map((w) => Math.max(w.turnover, w.restockingCost))) * 1.15;

  return (
    <div className="space-y-6">
      
      {/* Title Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0a1530] to-[#1e1b4b] border border-blue-900/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Analyse Hebdomadaire Comparée</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 tracking-tight">
            Chiffre d'Affaires vs Dépenses de Ravitaillement
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Graphique illustratif confrontant les ventes générées par semaine face aux décaissements d'approvisionnement auprès des fournisseurs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-blue-500/30 text-right">
            <span className="text-[10px] text-blue-300 uppercase font-mono block">Marge Globale 5 Semaines</span>
            <span className="text-base font-bold font-mono text-amber-400">
              +{formatFCFA(totalGrossMargin)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-900/40 shadow-lg">
          <span className="text-xs text-slate-400 block">Total Chiffre d'Affaires</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
            {formatFCFA(totalTurnover)}
          </span>
          <span className="text-[11px] text-blue-300 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Croissance soutenue</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/40 shadow-lg">
          <span className="text-xs text-slate-400 block">Dépenses Ravitaillement (Achats)</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {formatFCFA(totalRestocking)}
          </span>
          <span className="text-[11px] text-amber-300 mt-1 flex items-center gap-1 font-medium">
            <Truck className="w-3 h-3" />
            <span>Réapprovisionnements stocks</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-900/40 shadow-lg">
          <span className="text-xs text-slate-400 block">Marge Commerciale Brute</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {formatFCFA(totalGrossMargin)}
          </span>
          <span className="text-[11px] text-emerald-300 mt-1 block">
            Taux moyen : <strong className="font-mono">{overallMarginRate}%</strong>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-900/40 shadow-lg">
          <span className="text-xs text-slate-400 block">Semaine Active Sélectionnée</span>
          <span className="text-base font-bold font-mono text-purple-300 mt-1 block truncate">
            {selectedWeek.weekLabel.split(' ')[0]} {selectedWeek.weekLabel.split(' ')[1]}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            {selectedWeek.startDate} - {selectedWeek.endDate}
          </span>
        </div>
      </div>

      {/* THE COMPARATIVE VISUAL GRAPH (BARS + CURVES) */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800 shadow-2xl space-y-6">
        
        {/* Graph Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-400 shadow-sm" />
              <span className="text-slate-300 font-medium">Chiffre d'Affaires Hebdomadaire (Ventes)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm" />
              <span className="text-slate-300 font-medium">Dépenses Ravitaillement (Achats Fournisseurs)</span>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Cliquez sur une barre pour voir le détail de la semaine
          </div>
        </div>

        {/* SVG Interactive Dual Bar & Line Graph */}
        <div className="relative w-full h-72 sm:h-80">
          
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-dashed border-slate-600 w-full" />
            ))}
          </div>

          {/* Columns Display */}
          <div className="relative h-full flex items-end justify-around pt-6 pb-8 gap-2 sm:gap-4">
            {weeklyData.map((w, idx) => {
              const turnoverHeightPct = (w.turnover / maxVal) * 100;
              const restockingHeightPct = (w.restockingCost / maxVal) * 100;
              const isSelected = selectedWeekIdx === idx;
              const weeklyMargin = w.turnover - w.restockingCost;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedWeekIdx(idx)}
                  className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all ${
                    isSelected ? 'opacity-100 scale-102' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Floating tooltip preview on hover / selected */}
                  <div
                    className={`mb-2 px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap transition-all shadow-md ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold border border-amber-300'
                        : 'bg-slate-800 text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    Marge: +{formatFCFA(weeklyMargin)}
                  </div>

                  {/* Dual Bar Container */}
                  <div className="w-full max-w-[80px] flex items-end justify-center gap-1.5 sm:gap-2.5 h-[180px] sm:h-[200px]">
                    
                    {/* Blue Bar: Turnover */}
                    <div
                      className="w-1/2 rounded-t-md bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-400 transition-all duration-500 relative group-hover:brightness-110 shadow-lg"
                      style={{ height: `${turnoverHeightPct}%` }}
                    >
                      <span className="sr-only">CA: {formatFCFA(w.turnover)}</span>
                    </div>

                    {/* Yellow/Amber Bar: Restocking */}
                    <div
                      className="w-1/2 rounded-t-md bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-400 transition-all duration-500 relative group-hover:brightness-110 shadow-lg"
                      style={{ height: `${restockingHeightPct}%` }}
                    >
                      <span className="sr-only">Ravitaillement: {formatFCFA(w.restockingCost)}</span>
                    </div>
                  </div>

                  {/* Label under bar */}
                  <div className="mt-3 text-center">
                    <span
                      className={`text-[11px] font-mono block transition-colors ${
                        isSelected ? 'text-amber-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {w.weekLabel.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:block truncate max-w-[90px]">
                      {w.startDate.split(' ')[0]} {w.startDate.split(' ')[1]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Week Detailed Focus Panel */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Détail Sélectionné :</span>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {selectedWeek.weekLabel} ({selectedWeek.startDate} &rarr; {selectedWeek.endDate})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Chiffre d'Affaires</span>
              <span className="text-cyan-400 font-bold text-sm">{formatFCFA(selectedWeek.turnover)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Dépenses Ravitaillement</span>
              <span className="text-amber-400 font-bold text-sm">{formatFCFA(selectedWeek.restockingCost)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Marge Hebdomadaire</span>
              <span className="text-emerald-400 font-bold text-sm">
                +{formatFCFA(selectedWeek.turnover - selectedWeek.restockingCost)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Articles Ravitaillés</span>
              <span className="text-slate-300 font-bold">{selectedWeek.itemsRestocked} unités</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
