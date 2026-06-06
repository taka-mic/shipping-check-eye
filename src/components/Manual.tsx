import { BookOpen, Package, ScanSearch, ClipboardCheck, Camera, MousePointerClick, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

const Step = ({ num, children }: { num: number; children: React.ReactNode }) => (
  <div className="flex gap-3 mb-3 last:mb-0">
    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
      {num}
    </div>
    <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
  </div>
);

export default function Manual() {
  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={20} className="text-blue-600" />
          <h2 className="font-bold text-blue-800">出荷チェックアイとは</h2>
        </div>
        <p className="text-sm text-blue-700 leading-relaxed">
          製品に貼られた「色付きシール」をカメラで撮影し、出荷予定の製品がすべてそろっているかを自動で判別・チェックするツールです。
          全部で3つのタブを順番に使います。
        </p>
      </div>

      {/* Flow overview */}
      <Section icon={<ScanSearch size={18} className="text-gray-500" />} title="全体の流れ">
        <div className="flex flex-col sm:flex-row gap-2 text-sm text-center">
          {[
            { icon: <Package size={18} />, label: '①マスタ登録', desc: '製品の色を登録', color: 'bg-green-100 text-green-800 border-green-300' },
            { icon: <ScanSearch size={18} />, label: '②出荷チェック', desc: '写真から色を検出', color: 'bg-purple-100 text-purple-800 border-purple-300' },
            { icon: <ClipboardCheck size={18} />, label: '③照合', desc: '依頼書と突き合わせ', color: 'bg-orange-100 text-orange-800 border-orange-300' },
          ].map((item, i) => (
            <div key={i} className="flex sm:flex-col items-center gap-2 flex-1">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border font-medium flex-1 sm:w-full justify-center ${item.color}`}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">{item.desc}</p>
              {i < 2 && <span className="text-gray-400 sm:hidden">→</span>}
            </div>
          ))}
        </div>
      </Section>

      {/* Step 1 */}
      <Section icon={<Package size={18} className="text-green-500" />} title="① マスタ登録タブ — 製品の色を登録する">
        <Step num={1}>
          製品に貼ったシールを<strong>スマホやタブレットのカメラで撮影</strong>して保存します。
        </Step>
        <Step num={2}>
          「クリックまたはドラッグ&ドロップ」エリアをタップして、撮影した画像を選択します。
        </Step>
        <Step num={3}>
          画像が表示されたら、<strong>シールの部分をタップ</strong>して色を採取します（最初は自動で中央から採取されます）。
        </Step>
        <Step num={4}>
          画像の下に色のプレビューが表示されたら、<strong>製品名を入力</strong>して「登録」ボタンを押します。
        </Step>
        <Step num={5}>
          すべての製品（最大10種類程度）について同様に登録します。登録済み一覧に製品名と色が表示されます。
        </Step>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
          <Lightbulb size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">
            <strong>コツ：</strong>シールは白い壁や机の上に置いて撮影すると、背景の影響を受けにくくなります。シールの中心部をタップしてください。
          </p>
        </div>
      </Section>

      {/* Step 2 */}
      <Section icon={<ScanSearch size={18} className="text-purple-500" />} title="② 出荷チェックタブ — 写真から製品を検出する">
        <Step num={1}>
          出荷する製品を<strong>一か所に並べて上から撮影</strong>します。シールが見えるように配置してください。
        </Step>
        <Step num={2}>
          「出荷製品を並べた写真をアップロード」エリアをタップして、撮影した画像を選択します。
        </Step>
        <Step num={3}>
          「<strong>色を検出</strong>」ボタンを押します。画像全体をスキャンして、登録済みの色を探します。
        </Step>
        <Step num={4}>
          検出が完了すると、画像上にカラーのマーカーが重なって表示されます。右下に検出された製品と個数のサマリーが表示されます。
        </Step>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
          <Lightbulb size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">
            <strong>コツ：</strong>照明を均一にして影が出ないようにすると検出精度が上がります。シールが重ならないように製品を並べてください。
          </p>
        </div>
      </Section>

      {/* Step 3 */}
      <Section icon={<ClipboardCheck size={18} className="text-orange-500" />} title="③ 照合タブ — 出荷依頼書と突き合わせる">
        <Step num={1}>
          「出荷依頼書入力」欄に、出荷依頼書の内容を入力します。
        </Step>
        <Step num={2}>
          <div>
            <strong>1行に「製品名 数量」の形式</strong>で入力してください：
            <pre className="mt-1 bg-gray-100 rounded p-2 text-xs font-mono">製品A 3{'\n'}製品B 2{'\n'}製品C 5</pre>
          </div>
        </Step>
        <Step num={3}>
          「依頼書を読み込む」ボタンを押すと、検出結果と依頼数量が自動で突き合わされます。
          <span className="text-green-600">✓（一致）</span> / <span className="text-red-600">✗（不一致）</span>で表示されます。
        </Step>
        <Step num={4}>
          実物と照合しながら、各製品のチェックボックスにチェックを入れます。全製品にチェックが入ると「完了」メッセージが表示されます。
        </Step>
      </Section>

      {/* Tips */}
      <Section icon={<AlertTriangle size={18} className="text-red-500" />} title="よくある問題と対処法">
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="font-medium text-red-800 mb-1">検出数が多すぎる・少なすぎる</p>
            <p className="text-red-700">照明を変えて撮り直すか、マスタ登録時の色の採取位置を変えて再登録してください。シールの端ではなく中心部を採取するのがコツです。</p>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="font-medium text-red-800 mb-1">似た色の製品が誤検出される</p>
            <p className="text-red-700">色が近い製品は区別が難しい場合があります。シールの色をより違いが出るものに変えることをご検討ください。</p>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="font-medium text-red-800 mb-1">カメラが起動しない</p>
            <p className="text-red-700">ブラウザのカメラアクセスを許可してください。または写真アプリで撮影後、ファイルとして選択することもできます。</p>
          </div>
        </div>
      </Section>

      {/* Notes */}
      <Section icon={<CheckCircle size={18} className="text-blue-500" />} title="注意事項">
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex gap-2"><span className="text-blue-500 flex-shrink-0">•</span>マスタデータはこのブラウザ・端末に保存されます。別の端末では再登録が必要です。</li>
          <li className="flex gap-2"><span className="text-blue-500 flex-shrink-0">•</span>画像はサーバーに送信されません。すべてブラウザ内で処理されます。</li>
          <li className="flex gap-2"><span className="text-blue-500 flex-shrink-0">•</span>カメラ撮影にはHTTPS接続が必要です（このサイトは対応済みです）。</li>
          <li className="flex gap-2"><span className="text-blue-500 flex-shrink-0">•</span>このツールは補助ツールです。最終確認は必ず人の目で行ってください。</li>
        </ul>
      </Section>

      {/* Camera tip */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3">
        <Camera size={20} className="text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">タブレットでの撮影について</p>
          <p>ファイル選択時に「カメラ」を選ぶとその場で撮影できます。事前に写真アプリで撮影した画像をアップロードすることも可能です。</p>
        </div>
      </div>

      {/* Usage guide icon legend */}
      <Section icon={<MousePointerClick size={18} className="text-gray-500" />} title="画面上のアイコン説明">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          {[
            { icon: '🟢', label: '登録済みマスタの色' },
            { icon: '🔵', label: '検出マーカー（製品ごとに色が異なる）' },
            { icon: '✓', label: '依頼数と検出数が一致' },
            { icon: '✗', label: '依頼数と検出数が不一致' },
            { icon: '□', label: '未確認（チェックなし）' },
            { icon: '☑', label: '確認済み（チェックあり）' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
