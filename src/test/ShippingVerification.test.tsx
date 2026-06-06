import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShippingVerification from '../components/ShippingVerification';
import type { DetectionResult } from '../types';

const makeResult = (id: string, name: string, count: number, checked = false): DetectionResult => ({
  masterId: id,
  productName: name,
  count,
  color: '#ef4444',
  positions: [{ x: 10, y: 10 }],
  checked,
});

describe('ShippingVerification', () => {
  it('検出結果がないとき案内メッセージが表示される', () => {
    render(<ShippingVerification results={[]} onResults={vi.fn()} />);
    expect(screen.getByText(/出荷チェック.*タブで/)).toBeInTheDocument();
  });

  it('検出結果が表示される', () => {
    const results = [makeResult('1', '製品A', 3)];
    render(<ShippingVerification results={results} onResults={vi.fn()} />);
    expect(screen.getByText('製品A')).toBeInTheDocument();
    // count と「個」は別 span に分かれるため部分一致で確認
    expect(screen.getByText(/3個/)).toBeInTheDocument();
  });

  it('チェックボックスをクリックすると onResults が呼ばれる', () => {
    const onResults = vi.fn();
    const results = [makeResult('1', '製品A', 2)];
    render(<ShippingVerification results={results} onResults={onResults} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onResults).toHaveBeenCalledTimes(1);
    // checked が反転した結果が渡される
    const called = onResults.mock.calls[0][0] as DetectionResult[];
    expect(called[0].checked).toBe(true);
  });

  it('全チェック済みで完了メッセージが表示される', () => {
    const results = [makeResult('1', '製品A', 1, true)];
    render(<ShippingVerification results={results} onResults={vi.fn()} />);
    expect(screen.getByText(/全製品の確認が完了/)).toBeInTheDocument();
  });

  it('未完了のときは完了メッセージが表示されない', () => {
    const results = [makeResult('1', '製品A', 1, false)];
    render(<ShippingVerification results={results} onResults={vi.fn()} />);
    expect(screen.queryByText(/全製品の確認が完了/)).not.toBeInTheDocument();
  });

  it('出荷依頼書を読み込めるテキストエリアがある', () => {
    render(<ShippingVerification results={[]} onResults={vi.fn()} />);
    expect(screen.getByPlaceholderText(/製品A 3/)).toBeInTheDocument();
  });

  it('依頼書の数量と検出数が一致するとき ✓ が表示される', () => {
    const results = [makeResult('1', '製品A', 3)];
    const { container } = render(<ShippingVerification results={results} onResults={vi.fn()} />);

    const textarea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '製品A 3' } });
    fireEvent.click(screen.getByText('依頼書を読み込む'));

    // CheckCircle icon が SVG として描画されるため、依頼3個 のテキストを確認
    expect(container.textContent).toContain('依頼3個');
  });

  it('依頼書の数量と検出数が不一致のとき表示に反映される', () => {
    const results = [makeResult('1', '製品B', 2)];
    const { container } = render(<ShippingVerification results={results} onResults={vi.fn()} />);

    const textarea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '製品B 5' } });
    fireEvent.click(screen.getByText('依頼書を読み込む'));

    expect(container.textContent).toContain('依頼5個');
  });

  it('依頼書にあって未検出の製品が「未検出」として表示される', () => {
    const results = [makeResult('1', '製品A', 1)];
    render(<ShippingVerification results={results} onResults={vi.fn()} />);

    const textarea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '製品A 1\n製品Z 2' } });
    fireEvent.click(screen.getByText('依頼書を読み込む'));

    expect(screen.getByText(/未検出/)).toBeInTheDocument();
    expect(screen.getByText('製品Z')).toBeInTheDocument();
  });

  it('不正フォーマットの依頼書はエラーメッセージが出る', () => {
    render(<ShippingVerification results={[]} onResults={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'これは不正なフォーマット' } });
    fireEvent.click(screen.getByText('依頼書を読み込む'));
    expect(screen.getByText(/解析できない行/)).toBeInTheDocument();
  });
});
