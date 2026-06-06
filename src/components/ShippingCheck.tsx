import { useRef, useState, useCallback } from 'react';
import { Upload, ScanSearch, RefreshCw } from 'lucide-react';
import { rgbToHsv, matchesColor, MARKER_COLORS } from '../colorUtils';
import type { ColorMaster, DetectionResult } from '../types';

interface Props {
  masters: ColorMaster[];
  results: DetectionResult[];
  onResults: (r: DetectionResult[]) => void;
}

// Sliding window scan step (px in canvas coords)
const SCAN_STEP = 10;
// Minimum cluster distance to merge nearby detections
const CLUSTER_DIST = 30;

export default function ShippingCheck({ masters, results, onResults }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      const maxW = Math.min(700, window.innerWidth - 32);
      const scale = Math.min(maxW / img.naturalWidth, 500 / img.naturalHeight, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const overlay = overlayRef.current!;
      overlay.width = canvas.width;
      overlay.height = canvas.height;

      setImageLoaded(true);
      onResults([]);
    };
    img.src = url;
  };

  const runScan = useCallback(async () => {
    if (!imageLoaded || masters.length === 0) return;
    setScanning(true);

    await new Promise(r => setTimeout(r, 10)); // yield to render

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Collect raw hit positions per master
    const rawHits: Map<string, { x: number; y: number }[]> = new Map(
      masters.map(m => [m.id, []])
    );

    for (let y = 0; y < canvas.height; y += SCAN_STEP) {
      for (let x = 0; x < canvas.width; x += SCAN_STEP) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const hsv = rgbToHsv(r, g, b);
        for (const master of masters) {
          if (matchesColor(hsv, master.hsv)) {
            rawHits.get(master.id)!.push({ x, y });
          }
        }
      }
    }

    // Cluster hits using simple greedy clustering
    const detections: DetectionResult[] = [];
    masters.forEach((master, i) => {
      const hits = rawHits.get(master.id)!;
      const clusters: { x: number; y: number }[] = [];

      for (const hit of hits) {
        let merged = false;
        for (const c of clusters) {
          const dx = hit.x - c.x, dy = hit.y - c.y;
          if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_DIST) {
            // update centroid
            c.x = Math.round((c.x + hit.x) / 2);
            c.y = Math.round((c.y + hit.y) / 2);
            merged = true;
            break;
          }
        }
        if (!merged) clusters.push({ ...hit });
      }

      if (clusters.length > 0) {
        detections.push({
          masterId: master.id,
          productName: master.productName,
          count: clusters.length,
          color: MARKER_COLORS[i % MARKER_COLORS.length],
          positions: clusters,
          checked: false,
        });
      }
    });

    // Draw overlay
    const overlay = overlayRef.current!;
    const octx = overlay.getContext('2d')!;
    octx.clearRect(0, 0, overlay.width, overlay.height);

    detections.forEach(det => {
      octx.strokeStyle = det.color;
      octx.fillStyle = det.color;
      octx.lineWidth = 2;
      octx.font = 'bold 11px sans-serif';

      det.positions.forEach(pos => {
        const r = 18;
        octx.beginPath();
        octx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        octx.globalAlpha = 0.35;
        octx.fill();
        octx.globalAlpha = 1;
        octx.stroke();

        // Label
        octx.fillStyle = '#fff';
        octx.strokeStyle = '#000';
        octx.lineWidth = 3;
        const label = det.productName.slice(0, 4);
        octx.strokeText(label, pos.x - octx.measureText(label).width / 2, pos.y + 4);
        octx.fillText(label, pos.x - octx.measureText(label).width / 2, pos.y + 4);
        octx.strokeStyle = det.color;
        octx.lineWidth = 2;
        octx.fillStyle = det.color;
      });
    });

    onResults(detections);
    setScanning(false);
  }, [imageLoaded, masters, onResults]);

  const reset = () => {
    setImageLoaded(false);
    onResults([]);
    imgRef.current = null;
    if (overlayRef.current) {
      overlayRef.current.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ScanSearch size={20} className="text-purple-500" />
          出荷チェック画像
        </h2>

        {!imageLoaded ? (
          <div
            className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center cursor-pointer hover:bg-purple-50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadImage(f); }}
          >
            <Upload size={32} className="mx-auto text-purple-400 mb-2" />
            <p className="text-sm text-gray-600">出荷製品を並べた写真をアップロード</p>
            {masters.length === 0 && (
              <p className="text-xs text-red-400 mt-2">先にマスタを登録してください</p>
            )}
          </div>
        ) : (
          <div className="flex gap-2 mb-3">
            <button
              onClick={runScan}
              disabled={scanning}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {scanning
                ? <><RefreshCw size={16} className="animate-spin" />スキャン中...</>
                : <><ScanSearch size={16} />色を検出</>}
            </button>
            <button onClick={reset}
              className="border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
              リセット
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); e.target.value = ''; }} />

        {imageLoaded && (
          <div className="relative overflow-auto">
            <p className="text-xs text-gray-500 mb-2 text-center">
              {results.length > 0 ? '検出結果（マーカー付き）' : '画像を読み込みました。「色を検出」を押してください'}
            </p>
            <div className="relative inline-block">
              <canvas ref={canvasRef} className="rounded border border-gray-200 block max-w-full" />
              <canvas ref={overlayRef} className="absolute top-0 left-0 rounded pointer-events-none max-w-full" />
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">検出結果サマリー</h2>
          <div className="space-y-2">
            {results.map(det => (
              <div key={det.masterId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: det.color }} />
                <span className="flex-1 font-medium text-gray-800">{det.productName}</span>
                <span className="text-2xl font-bold" style={{ color: det.color }}>{det.count}</span>
                <span className="text-sm text-gray-500">個</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
