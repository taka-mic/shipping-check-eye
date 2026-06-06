import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, Plus, Trash2, CheckCircle } from 'lucide-react';
import { rgbToHsv, extractColorFromRegion, MARKER_COLORS } from '../colorUtils';
import { addMaster, deleteMaster } from '../storage';
import type { ColorMaster } from '../types';

interface Props {
  masters: ColorMaster[];
  onMastersChange: (m: ColorMaster[]) => void;
}

export default function MasterRegistration({ masters, onMastersChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pickedRgb, setPickedRgb] = useState<{ r: number; g: number; b: number } | null>(null);
  const [productName, setProductName] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const drawImageOnCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxW = Math.min(600, window.innerWidth - 32);
    const scale = Math.min(maxW / img.naturalWidth, 400 / img.naturalHeight, 1);
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Auto-pick center color
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const rgb = extractColorFromRegion(ctx, cx, cy, 12);
    setPickedRgb(rgb);
    drawCrosshair(ctx, cx, cy);
  }, []);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      drawImageOnCanvas(img);
    };
    img.src = url;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = Math.round((e.clientX - rect.left) * scaleX);
    const cy = Math.round((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext('2d')!;

    // Redraw image then crosshair
    if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    const rgb = extractColorFromRegion(ctx, cx, cy, 12);
    setPickedRgb(rgb);
    drawCrosshair(ctx, cx, cy);
  };

  const drawCrosshair = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    const r = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r - 6, cy); ctx.lineTo(cx + r + 6, cy);
    ctx.moveTo(cx, cy - r - 6); ctx.lineTo(cx, cy + r + 6);
    ctx.stroke();
    ctx.restore();
  };

  const handleRegister = () => {
    if (!pickedRgb || !productName.trim()) return;
    const hsv = rgbToHsv(pickedRgb.r, pickedRgb.g, pickedRgb.b);
    const master: ColorMaster = {
      id: crypto.randomUUID(),
      productName: productName.trim(),
      rgb: pickedRgb,
      hsv,
      createdAt: Date.now(),
    };
    onMastersChange(addMaster(master));
    setProductName('');
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleDelete = (id: string) => {
    onMastersChange(deleteMaster(id));
  };

  const rgbStr = pickedRgb ? `rgb(${pickedRgb.r},${pickedRgb.g},${pickedRgb.b})` : '';
  const hsv = pickedRgb ? rgbToHsv(pickedRgb.r, pickedRgb.g, pickedRgb.b) : null;

  return (
    <div className="space-y-6">
      {/* Image upload area */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Camera size={20} className="text-blue-500" />
          シール撮影・画像アップロード
        </h2>

        <div
          className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <Upload size={32} className="mx-auto text-blue-400 mb-2" />
          <p className="text-sm text-gray-600">クリックまたはドラッグ&ドロップで画像を選択</p>
          <p className="text-xs text-gray-400 mt-1">カメラ撮影した画像をアップロード</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

        {imageLoaded && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 text-center">画像内をクリックして色を選択</p>
            <div className="flex justify-center overflow-auto">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="cursor-crosshair rounded border border-gray-200 max-w-full"
                style={{ maxHeight: 400 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Color registration */}
      {pickedRgb && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Plus size={20} className="text-green-500" />
            色を登録
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-inner flex-shrink-0"
              style={{ backgroundColor: rgbStr }} />
            <div className="text-sm text-gray-600 space-y-1">
              <p>RGB: {pickedRgb.r}, {pickedRgb.g}, {pickedRgb.b}</p>
              {hsv && <p>HSV: {hsv.h}°, {hsv.s}%, {hsv.v}%</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              placeholder="製品名を入力..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleRegister}
              disabled={!productName.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              {savedMsg ? <CheckCircle size={16} /> : <Plus size={16} />}
              {savedMsg ? '登録済み' : '登録'}
            </button>
          </div>
        </div>
      )}

      {/* Master list */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          登録済みマスタ ({masters.length}件)
        </h2>
        {masters.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">マスタが登録されていません</p>
        ) : (
          <div className="space-y-2">
            {masters.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow flex-shrink-0"
                  style={{ backgroundColor: `rgb(${m.rgb.r},${m.rgb.g},${m.rgb.b})` }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{m.productName}</p>
                  <p className="text-xs text-gray-500">
                    HSV: {m.hsv.h}°, {m.hsv.s}%, {m.hsv.v}%
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MARKER_COLORS[i % MARKER_COLORS.length] }} />
                <button onClick={() => handleDelete(m.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
