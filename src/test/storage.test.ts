import { describe, it, expect, beforeEach } from 'vitest';
import { loadMasters, saveMasters, addMaster, deleteMaster } from '../storage';
import type { ColorMaster } from '../types';

const makeMaster = (id: string, name: string): ColorMaster => ({
  id,
  productName: name,
  rgb: { r: 255, g: 0, b: 0 },
  hsv: { h: 0, s: 100, v: 100 },
  createdAt: Date.now(),
});

beforeEach(() => {
  localStorage.clear();
});

describe('loadMasters', () => {
  it('空の場合は空配列を返す', () => {
    expect(loadMasters()).toEqual([]);
  });

  it('保存済みデータを正しく読み込む', () => {
    const masters = [makeMaster('1', '製品A')];
    localStorage.setItem('shipping_check_masters', JSON.stringify(masters));
    expect(loadMasters()).toEqual(masters);
  });

  it('LocalStorage が壊れていても空配列を返す（クラッシュしない）', () => {
    localStorage.setItem('shipping_check_masters', 'invalid_json{{{');
    expect(() => loadMasters()).not.toThrow();
    expect(loadMasters()).toEqual([]);
  });
});

describe('saveMasters', () => {
  it('マスタ一覧を保存・復元できる', () => {
    const masters = [makeMaster('1', 'A'), makeMaster('2', 'B')];
    saveMasters(masters);
    expect(loadMasters()).toEqual(masters);
  });

  it('空配列を保存すると loadMasters で空配列が返る', () => {
    saveMasters([makeMaster('1', 'A')]);
    saveMasters([]);
    expect(loadMasters()).toEqual([]);
  });
});

describe('addMaster', () => {
  it('新規マスタが追加される', () => {
    const m = makeMaster('1', '製品A');
    const result = addMaster(m);
    expect(result).toHaveLength(1);
    expect(result[0].productName).toBe('製品A');
  });

  it('複数追加すると件数が増える', () => {
    addMaster(makeMaster('1', 'A'));
    addMaster(makeMaster('2', 'B'));
    const result = addMaster(makeMaster('3', 'C'));
    expect(result).toHaveLength(3);
  });

  it('追加後 loadMasters でも取得できる', () => {
    const m = makeMaster('x', 'XProduct');
    addMaster(m);
    const loaded = loadMasters();
    expect(loaded.some(l => l.id === 'x')).toBe(true);
  });
});

describe('deleteMaster', () => {
  it('指定 ID のマスタが削除される', () => {
    addMaster(makeMaster('1', 'A'));
    addMaster(makeMaster('2', 'B'));
    const result = deleteMaster('1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('存在しない ID を削除してもエラーにならない', () => {
    addMaster(makeMaster('1', 'A'));
    const result = deleteMaster('nonexistent');
    expect(result).toHaveLength(1);
  });

  it('全件削除すると空配列になる', () => {
    addMaster(makeMaster('1', 'A'));
    const result = deleteMaster('1');
    expect(result).toEqual([]);
  });

  it('削除後 loadMasters でも反映される', () => {
    addMaster(makeMaster('del', 'ToDelete'));
    deleteMaster('del');
    expect(loadMasters().some(m => m.id === 'del')).toBe(false);
  });
});
