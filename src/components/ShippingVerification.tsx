import { useState } from 'react';
import { ClipboardCheck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { DetectionResult } from '../types';

interface Props {
  results: DetectionResult[];
  onResults: (r: DetectionResult[]) => void;
}

interface OrderItem {
  productName: string;
  quantity: number;
}

export default function ShippingVerification({ results, onResults }: Props) {
  const [orderInput, setOrderInput] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [parseError, setParseError] = useState('');

  const toggleCheck = (masterId: string) => {
    onResults(results.map(r =>
      r.masterId === masterId ? { ...r, checked: !r.checked } : r
    ));
  };

  const parseOrder = () => {
    setParseError('');
    const lines = orderInput.split('\n').map(l => l.trim()).filter(Boolean);
    const items: OrderItem[] = [];
    for (const line of lines) {
      // Accept "製品名 数量" or "製品名: 数量" or "製品名　数量"
      const match = line.match(/^(.+?)[\s:：　]+(\d+)\s*[個本枚]?$/);
      if (match) {
        items.push({ productName: match[1].trim(), quantity: parseInt(match[2]) });
      } else {
        setParseError(`解析できない行: "${line}" （形式: "製品名 数量"）`);
        return;
      }
    }
    setOrderItems(items);
  };

  const allChecked = results.length > 0 && results.every(r => r.checked);

  // Compare detected vs ordered
  const getOrderQty = (name: string) =>
    orderItems.find(o => o.productName === name)?.quantity ?? null;

  const undetectedOrders = orderItems.filter(
    o => !results.some(r => r.productName === o.productName)
  );

  return (
    <div className="space-y-6">
      {/* Order input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ClipboardCheck size={20} className="text-orange-500" />
          出荷依頼書入力
        </h2>
        <p className="text-xs text-gray-500 mb-2">1行に「製品名 数量」の形式で入力（例: 製品A 3）</p>
        <textarea
          value={orderInput}
          onChange={e => setOrderInput(e.target.value)}
          rows={5}
          placeholder={"製品A 3\n製品B 2\n製品C 5"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y font-mono"
        />
        {parseError && <p className="text-xs text-red-500 mt-1">{parseError}</p>}
        <button
          onClick={parseOrder}
          disabled={!orderInput.trim()}
          className="mt-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          依頼書を読み込む
        </button>
      </div>

      {/* Verification table */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          照合チェック
          {results.length > 0 && (
            <span className={`ml-auto text-sm font-medium px-2 py-0.5 rounded-full ${allChecked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {results.filter(r => r.checked).length}/{results.length} 確認済み
            </span>
          )}
        </h2>

        {results.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p className="text-sm">「出荷チェック」タブで画像を解析してください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map(det => {
              const ordQty = getOrderQty(det.productName);
              const matched = ordQty !== null && ordQty === det.count;
              const mismatch = ordQty !== null && ordQty !== det.count;

              return (
                <label key={det.masterId}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border
                    ${det.checked
                      ? 'bg-green-50 border-green-200'
                      : mismatch
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                >
                  <input
                    type="checkbox"
                    checked={det.checked}
                    onChange={() => toggleCheck(det.masterId)}
                    className="w-5 h-5 rounded accent-green-500 cursor-pointer"
                  />
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: det.color }} />
                  <span className="flex-1 font-medium text-gray-800">{det.productName}</span>

                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-gray-700">{det.count}個</span>
                      {ordQty !== null && (
                        <>
                          <span className="text-gray-400 text-xs">/ 依頼{ordQty}個</span>
                          {matched
                            ? <CheckCircle size={16} className="text-green-500" />
                            : <XCircle size={16} className="text-red-500" />}
                        </>
                      )}
                    </div>
                  </div>

                  {det.checked
                    ? <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    : <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                </label>
              );
            })}

            {undetectedOrders.map(o => (
              <div key={o.productName} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <XCircle size={20} className="text-red-500 flex-shrink-0" />
                <span className="flex-1 font-medium text-red-700">{o.productName}</span>
                <span className="text-sm text-red-600">未検出 (依頼:{o.quantity}個)</span>
              </div>
            ))}
          </div>
        )}

        {allChecked && results.length > 0 && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
            <CheckCircle size={24} className="mx-auto text-green-600 mb-1" />
            <p className="font-semibold text-green-800">全製品の確認が完了しました</p>
          </div>
        )}
      </div>
    </div>
  );
}
