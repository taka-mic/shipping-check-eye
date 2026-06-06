import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MasterRegistration from '../components/MasterRegistration';
import type { ColorMaster } from '../types';

// crypto.randomUUID は jsdom で利用可能だが念のためモック
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

beforeEach(() => {
  localStorage.clear();
});

const renderComponent = (masters: ColorMaster[] = [], onChange = vi.fn()) =>
  render(<MasterRegistration masters={masters} onMastersChange={onChange} />);

describe('MasterRegistration', () => {
  it('初期表示: アップロードエリアが表示される', () => {
    renderComponent();
    expect(screen.getByText(/クリックまたはドラッグ/)).toBeInTheDocument();
  });

  it('マスタが0件のとき「登録されていません」メッセージが表示される', () => {
    renderComponent([]);
    expect(screen.getByText(/マスタが登録されていません/)).toBeInTheDocument();
  });

  it('マスタ一覧に製品名が表示される', () => {
    const masters: ColorMaster[] = [
      { id: '1', productName: '製品テスト', rgb: { r: 255, g: 0, b: 0 }, hsv: { h: 0, s: 100, v: 100 }, createdAt: 0 },
    ];
    renderComponent(masters);
    expect(screen.getByText('製品テスト')).toBeInTheDocument();
  });

  it('削除ボタンを押すと onMastersChange が呼ばれる', () => {
    const onChange = vi.fn();
    const masters: ColorMaster[] = [
      { id: '1', productName: '削除対象', rgb: { r: 0, g: 255, b: 0 }, hsv: { h: 120, s: 100, v: 100 }, createdAt: 0 },
    ];
    render(<MasterRegistration masters={masters} onMastersChange={onChange} />);
    const deleteBtn = screen.getByRole('button', { name: '' }); // Trash2 icon button
    fireEvent.click(deleteBtn);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('マスタ件数がヘッダに表示される', () => {
    const masters: ColorMaster[] = [
      { id: '1', productName: 'A', rgb: { r: 255, g: 0, b: 0 }, hsv: { h: 0, s: 100, v: 100 }, createdAt: 0 },
      { id: '2', productName: 'B', rgb: { r: 0, g: 255, b: 0 }, hsv: { h: 120, s: 100, v: 100 }, createdAt: 0 },
    ];
    renderComponent(masters);
    expect(screen.getByText(/登録済みマスタ \(2件\)/)).toBeInTheDocument();
  });

  it('画像がない状態で登録ボタンは表示されない', () => {
    renderComponent();
    // 登録フォームは画像を選択した後に表示されるので、最初は存在しない
    expect(screen.queryByPlaceholderText('製品名を入力...')).not.toBeInTheDocument();
  });
});
