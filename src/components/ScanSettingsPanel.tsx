import { Settings2, RotateCcw } from 'lucide-react';
import type { ScanSettings } from '../types';
import { DEFAULT_SCAN_SETTINGS } from '../types';

interface Props {
  settings: ScanSettings;
  onChange: (s: ScanSettings) => void;
}

const SliderRow = ({
  label,
  sub,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  sub: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      <span className="text-lg font-bold text-purple-600 w-16 text-right">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-purple-500"
    />
    <div className="flex justify-between text-xs text-gray-400">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

export default function ScanSettingsPanel({ settings, onChange }: Props) {
  const update = (patch: Partial<ScanSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <Settings2 size={18} className="text-purple-500" />
          スキャン検出パラメータ
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          値はこの端末に保存されます。再スキャンボタンで反映されます。
        </p>

        <div className="space-y-6">
          <SliderRow
            label="近接マージ距離"
            sub="画像幅に対する割合 — 大きくするとシールの影・分断を吸収しやすくなる"
            value={settings.proximityThresholdRatio}
            min={0.10}
            max={0.50}
            step={0.05}
            display={`${Math.round(settings.proximityThresholdRatio * 100)}%`}
            onChange={v => update({ proximityThresholdRatio: v })}
          />

          <SliderRow
            label="最小クラスタサイズ"
            sub="この数未満のヒット点はノイズとして除外する"
            value={settings.minClusterCells}
            min={1}
            max={10}
            step={1}
            display={`${settings.minClusterCells}点`}
            onChange={v => update({ minClusterCells: v })}
          />
        </div>
      </div>

      {/* ガイド */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3 text-sm text-gray-700">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Settings2 size={16} className="text-gray-400" />
          調整の目安
        </h3>
        <div className="space-y-2">
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
            <p className="font-medium text-orange-800 mb-0.5">1枚のシールが2個と数えられる</p>
            <p className="text-orange-700 text-xs">→ <strong>近接マージ距離を大きく</strong>（35〜50%）</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="font-medium text-blue-800 mb-0.5">別々の製品が1個にまとめられる</p>
            <p className="text-blue-700 text-xs">→ <strong>近接マージ距離を小さく</strong>（10〜20%）</p>
          </div>
          <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
            <p className="font-medium text-green-800 mb-0.5">背景の色が誤検出される</p>
            <p className="text-green-700 text-xs">→ <strong>最小クラスタサイズを大きく</strong>（5〜8点）</p>
          </div>
        </div>
      </div>

      {/* リセット */}
      <button
        onClick={() => onChange({ ...DEFAULT_SCAN_SETTINGS })}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
      >
        <RotateCcw size={14} />
        デフォルト値に戻す
      </button>
    </div>
  );
}
