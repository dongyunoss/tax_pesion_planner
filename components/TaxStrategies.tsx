'use client';

import { TaxSavingStrategy } from '@/lib/taxCalculator';

interface Props {
  strategies: TaxSavingStrategy[];
  totalSaving: number;
}

function fmt(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

const CATEGORY_STYLE = {
  pension: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: '🏦' },
  deduction: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', icon: '📊' },
  credit: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: '✅' },
};

const CATEGORY_LABEL = { pension: '연금', deduction: '소득공제', credit: '세액공제' };

export default function TaxStrategies({ strategies, totalSaving }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm">🎯</span>
          절세 전략
        </h2>
        {totalSaving > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500">최대 절세 효과</p>
            <p className="text-lg font-bold text-green-600">{fmt(totalSaving)}</p>
          </div>
        )}
      </div>

      {totalSaving > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
          <p className="text-sm font-medium opacity-90">모든 전략 적용 시 절세액</p>
          <p className="text-3xl font-bold mt-1">{fmt(totalSaving)}<span className="text-lg font-normal ml-1">/ 년</span></p>
          <p className="text-xs opacity-80 mt-1">월 {fmt(totalSaving / 12)} 절약 가능</p>
        </div>
      )}

      <div className="space-y-3">
        {strategies.map((strategy, i) => {
          const style = CATEGORY_STYLE[strategy.category];
          return (
            <div key={i} className={`${style.bg} ${style.border} border rounded-xl p-4 space-y-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{strategy.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                      {CATEGORY_LABEL[strategy.category]}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-600">절세 {fmt(strategy.taxSaving)}</p>
                  <p className="text-xs text-slate-500">추천 {fmt(strategy.recommendedAmount)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{strategy.description}</p>
              {strategy.recommendedAmount > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>추천 납입</span>
                    <span>{fmt(strategy.recommendedAmount)} / {fmt(strategy.maxAmount)} (최대)</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (strategy.recommendedAmount / strategy.maxAmount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ 주의사항</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          본 계산은 2024년 세법 기준 추정값입니다. 실제 세액은 개인 상황에 따라 다를 수 있으니 세무사 상담을 권장합니다.
        </p>
      </div>
    </div>
  );
}
