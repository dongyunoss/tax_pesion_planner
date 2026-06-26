'use client';

import { useState } from 'react';
import { UserInput } from '@/lib/taxCalculator';

interface Props {
  input: UserInput;
  onChange: (input: UserInput) => void;
}

function MoneyInput({
  label, value, onChange, hint, placeholder,
}: {
  label: string; value: number; onChange: (v: number) => void;
  hint?: string; placeholder?: string;
}) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);

  const display = focused ? raw : (value > 0 ? value.toLocaleString() : '');

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          placeholder={placeholder ?? '0'}
          onFocus={() => {
            setFocused(true);
            setRaw(value > 0 ? String(value) : '');
          }}
          onChange={e => {
            const digits = e.target.value.replace(/[^0-9]/g, '');
            setRaw(digits);
            onChange(digits === '' ? 0 : Number(digits));
          }}
          onBlur={() => setFocused(false)}
          className="w-full px-3 py-2.5 pr-8 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-right"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">원</span>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SliderField({
  label, value, min, max, step, unit, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-blue-600">{value.toLocaleString()}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min.toLocaleString()}{unit}</span>
        <span>{max.toLocaleString()}{unit}</span>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function InputForm({ input, onChange }: Props) {
  const update = (key: keyof UserInput, value: unknown) =>
    onChange({ ...input, [key]: value });

  const financialTotal = (input.annualInterestIncome || 0) + (input.annualDividendIncome || 0);
  const isOverThreshold = financialTotal > 20000000;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">📝</span>
        기본 정보 입력
      </h2>

      {/* 직장인 / 자영업자 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => update('employmentType', 'employee')}
          className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            input.employmentType === 'employee'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >직장인</button>
        <button
          onClick={() => update('employmentType', 'self-employed')}
          className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            input.employmentType === 'self-employed'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >자영업자</button>
      </div>

      {/* 근로소득 */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">근로소득</p>
        <MoneyInput
          label="월 소득"
          value={input.monthlyIncome}
          onChange={v => update('monthlyIncome', v)}
          hint={input.monthlyIncome > 0 ? `연 소득: ${(input.monthlyIncome * 12).toLocaleString()}원` : undefined}
          placeholder="예: 4000000"
        />
        <MoneyInput
          label="월 생활비"
          value={input.monthlyExpenses}
          onChange={v => update('monthlyExpenses', v)}
          placeholder="예: 2000000"
        />
        <MoneyInput
          label="월 저축 가능액"
          value={input.monthlySavings}
          onChange={v => update('monthlySavings', v)}
          placeholder="예: 500000"
        />
        <MoneyInput
          label="현재 월 연금 납입액"
          value={input.existingPension}
          onChange={v => update('existingPension', v)}
          placeholder="예: 100000"
        />
      </div>

      {/* 금융소득 */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">금융소득</p>
          {isOverThreshold && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              종합과세 대상
            </span>
          )}
          {financialTotal > 0 && !isOverThreshold && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              분리과세 (14%)
            </span>
          )}
        </div>

        <MoneyInput
          label="연간 이자소득"
          value={input.annualInterestIncome || 0}
          onChange={v => update('annualInterestIncome', v)}
          hint="예금·채권 이자 등"
          placeholder="예: 5000000"
        />
        <MoneyInput
          label="연간 배당소득"
          value={input.annualDividendIncome || 0}
          onChange={v => update('annualDividendIncome', v)}
          hint="주식 배당금, 펀드 분배금 등"
          placeholder="예: 3000000"
        />

        {financialTotal > 0 && (
          <div className={`rounded-xl p-3 text-xs space-y-1 ${isOverThreshold ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
            <div className="flex justify-between">
              <span className="text-slate-500">금융소득 합계</span>
              <span className="font-semibold text-slate-700">{(financialTotal / 10000).toFixed(0)}만원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">종합과세 기준</span>
              <span className="font-semibold text-slate-700">2,000만원</span>
            </div>
            {isOverThreshold ? (
              <p className="text-red-600 font-medium pt-1">
                ⚠ 기준 초과 {((financialTotal - 20000000) / 10000).toFixed(0)}만원 — 근로소득과 합산 과세됩니다
              </p>
            ) : (
              <p className="text-slate-500 pt-1">
                기준까지 {((20000000 - financialTotal) / 10000).toFixed(0)}만원 여유 — 원천징수(14%) 분리과세
              </p>
            )}
          </div>
        )}
      </div>

      {/* 나이 슬라이더 */}
      <div className="border-t border-slate-100 pt-4">
        <SliderField
          label="나이"
          value={input.age}
          min={20} max={70} step={1}
          unit="세"
          onChange={v => update('age', v)}
          hint={`은퇴까지 약 ${Math.max(0, 65 - input.age)}년 남음`}
        />
      </div>

      {/* 부양가족 */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">부양가족</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={input.hasSpouse}
            onChange={e => update('hasSpouse', e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm text-slate-600">배우자</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">자녀 수</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update('dependents', Math.max(0, input.dependents - 1))}
              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
            >−</button>
            <span className="w-8 text-center font-bold text-slate-800">{input.dependents}</span>
            <button
              onClick={() => update('dependents', Math.min(5, input.dependents + 1))}
              className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold hover:bg-blue-200 transition-colors"
            >+</button>
          </div>
          <span className="text-sm text-slate-500">명</span>
        </div>
      </div>
    </div>
  );
}
