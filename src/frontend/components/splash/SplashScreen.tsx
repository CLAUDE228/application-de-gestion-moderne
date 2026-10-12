import React, { useEffect, useState } from 'react';
import { Store, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initialisation du système...');

  useEffect(() => {
    const steps = [
      { p: 20, text: 'Chargement des dépendances Laravel API...' },
      { p: 45, text: 'Connexion au serveur de messagerie Django...' },
      { p: 70, text: 'Chargement du catalogue des articles & devises FCFA...' },
      { p: 90, text: 'Application du thème dégradé Sombre & Or...' },
      { p: 100, text: 'Système prêt ! Ouverture du supermarché...' },
    ];

    let timer: NodeJS.Timeout;
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].p);
        setCurrentStep(steps[stepIndex].text);
        stepIndex++;
      } else {
        clearInterval(interval);
        timer = setTimeout(() => {
          onComplete();
        }, 400);
      }
    }, 350);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black via-[#070d1e] to-[#0f172a] text-white overflow-hidden">
      {/* Decorative ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse delay-700" />
      
      <div className="relative z-10 max-w-md w-full mx-4 p-8 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-2xl backdrop-blur-xl text-center space-y-6">
        
        {/* Animated Brand Emblem */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-blue-500 to-amber-300 opacity-75 blur-md animate-spin" style={{ animationDuration: '6s' }} />
          <div className="relative w-18 h-18 rounded-2xl bg-slate-950 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-xl">
            <Store className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        {/* Title and branding */}
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Supermarché Le Grand Marché
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Système Intégré ERP & POS · Caisse, Finances & Ravitaillement
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span className="truncate pr-2">{currentStep}</span>
            <span className="text-amber-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Skip button */}
        <div className="pt-2">
          <button
            onClick={onComplete}
            className="text-xs text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
          >
            <span>Accéder directement</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
