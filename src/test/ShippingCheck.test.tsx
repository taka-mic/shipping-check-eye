import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShippingCheck from '../components/ShippingCheck';
import type { ColorMaster, DetectionResult } from '../types';

const makeMaster = (id: string, name: string): ColorMaster => ({
  id,
  productName: name,
  rgb: { r: 255, g: 0, b: 0 },
  hsv: { h: 0, s: 100, v: 100 },
  createdAt: 0,
});

describe('ShippingCheck', () => {
  it('画像未選択のときアップロードエリアが表示される', () => {
    render(<ShippingCheck masters={[]} results={[]} onResults={vi.fn()} />);
    expect(screen.getByText(/出荷製品を並べた写真をアップロード/)).toBeInTheDocument();
  });

  it('マスタが0件のとき警告メッセージが表示される', () => {
    render(<ShippingCheck masters={[]} results={[]} onResults={vi.fn()} />);
    expect(screen.getByText(/先にマスタを登録/)).toBeInTheDocument();
  });

  it('マスタがあるとき警告が表示されない', () => {
    const masters = [makeMaster('1', '製品A')];
    render(<ShippingCheck masters={masters} results={[]} onResults={vi.fn()} />);
    expect(screen.queryByText(/先にマスタを登録/)).not.toBeInTheDocument();
  });

  it('検出結果サマリーが表示される', () => {
    const results: DetectionResult[] = [
      { masterId: '1', productName: '製品A', count: 3, color: '#ef4444', positions: [], checked: false },
    ];
    render(<ShippingCheck masters={[makeMaster('1', '製品A')]} results={results} onResults={vi.fn()} />);
    expect(screen.getByText('検出結果サマリー')).toBeInTheDocument();
    expect(screen.getByText('製品A')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('検出結果が空のときサマリーは表示されない', () => {
    render(<ShippingCheck masters={[]} results={[]} onResults={vi.fn()} />);
    expect(screen.queryByText('検出結果サマリー')).not.toBeInTheDocument();
  });
});
