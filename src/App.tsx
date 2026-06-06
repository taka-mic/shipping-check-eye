import { useState, useEffect } from 'react';
import { Package, ScanSearch, ClipboardCheck } from 'lucide-react';
import MasterRegistration from './components/MasterRegistration';
import ShippingCheck from './components/ShippingCheck';
import ShippingVerification from './components/ShippingVerification';
import { loadMasters } from './storage';
import type { ColorMaster, DetectionResult } from './types';
import './index.css';

type Tab = 'master' | 'check' | 'verify';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'master', label: 'マスタ登録', icon: <Package size={18} /> },
  { id: 'check', label: '出荷チェック', icon: <ScanSearch size={18} /> },
  { id: 'verify', label: '照合', icon: <ClipboardCheck size={18} /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('master');
  const [masters, setMasters] = useState<ColorMaster[]>([]);
  const [results, setResults] = useState<DetectionResult[]>([]);

  useEffect(() => {
    setMasters(loadMasters());
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <ScanSearch size={22} />
          <h1 className="text-lg font-bold tracking-tight">出荷チェックアイ</h1>
          <span className="ml-auto text-xs bg-blue-500 px-2 py-0.5 rounded-full">
            マスタ {masters.length}件
          </span>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        {activeTab === 'master' && (
          <MasterRegistration masters={masters} onMastersChange={setMasters} />
        )}
        {activeTab === 'check' && (
          <ShippingCheck masters={masters} results={results} onResults={setResults} />
        )}
        {activeTab === 'verify' && (
          <ShippingVerification results={results} onResults={setResults} />
        )}
      </main>
    </div>
  );
}
