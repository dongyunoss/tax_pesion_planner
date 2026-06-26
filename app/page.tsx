'use client';

import { useState, useMemo } from 'react';
import InputForm from '@/components/InputForm';
import TaxSummary from '@/components/TaxSummary';
import TaxStrategies from '@/components/TaxStrategies';
import PensionPlan from '@/components/PensionPlan';
import CashflowPanel from '@/components/CashflowPanel';
import {
  UserInput,
  calculateTax,
  calculatePensionStrategy,
  generateTaxSavingStrategies,
} from '@/lib/taxCalculator';

const DEFAULT_INPUT: UserInput = {
  monthlyIncome: 4000000,
  age: 35,
  dependents: 0,
  hasSpouse: false,
  monthlyExpenses: 2000000,
  monthlySavings: 500000,
  existingPension: 0,
  employmentType: 'employee',
};

const TABS = [
  { id: 'tax', label: '세금 분석', emoji: '💰' },
  { id: 'strategy', label: '절세 전략', emoji: '🎯' },
  { id: 'pension', label: '연금 설계', emoji: '🏗️' },
  { id: 'cashflow', label: '현금흐름', emoji: '📈' },
] as const;

type Tab = typeof TABS[number]['id'];

export default function Home() {
  const [input, setInput] = useState<UserInput>(DEFAULT_INPUT);
  const [activeTab, setActiveTab] = useState<Tab>('tax');

  const taxResult = useMemo(() => calculateTax(input), [input]);
  const pensionStrategy = useMemo(() => calculatePensionStrategy(input, taxResult), [input, taxResult]);
  const strategies = useMemo(() => generateTaxSavingStrategies(input, taxResult), [input, taxResult]);
  const totalSaving = useMemo(() => strategies.reduce((s, st) => s + st.taxSaving, 0), [strategies]);

  function fmt(n: number) {
    if (n >= 10000) return `${(n / 10000).toFixed(0)}만원`;
    return `${n.toLocaleString()}원`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🏦</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">스마트 절세·연금 플래너</h1>
              <p className="text-sm text-blue-100 mt-0.5">월급과 현금흐름 기반 최적 절세 & 연금 설계</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '월 소득', value: fmt(input.monthlyIncome) },
              { label: '실효세율', value: `${(taxResult.effectiveTaxRate * 100).toFixed(1)}%` },
              { label: '최대 절세액', value: `${fmt(totalSaving)}/년` },
              { label: '예상 월 연금', value: fmt(pensionStrategy.expectedMonthlyPension + 800000) },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-blue-200">{stat.label}</p>
                <p className="text-lg font-bold mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Input */}
          <aside className="lg:w-80 shrink-0">
            <InputForm input={input} onChange={setInput} />
          </aside>

          {/* Right: Results */}
          <section className="flex-1 min-w-0">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-5 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'tax' && <TaxSummary result={taxResult} />}
            {activeTab === 'strategy' && (
              <TaxStrategies strategies={strategies} totalSaving={totalSaving} />
            )}
            {activeTab === 'pension' && (
              <PensionPlan strategy={pensionStrategy} input={input} />
            )}
            {activeTab === 'cashflow' && (
              <CashflowPanel
                input={input}
                result={taxResult}
                pensionContribution={pensionStrategy.totalPensionContribution}
              />
            )}
          </section>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200 mt-8">
        본 서비스는 참고용이며 실제 세액은 세무사 상담을 권장합니다 • 2024년 세법 기준
      </footer>
    </div>
  );
}
