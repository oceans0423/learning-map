# shadcn/ui 安裝紀錄

日期：2026-10-10。專案：`E:\DEV\leearning-map`。

## 已完成

- 透過官方 shadcn CLI 4.21.4 加入 `Button`，採用 new-york／Radix／TypeScript 設定。
- 安裝 Tailwind CSS 4 與 Vite plugin，設定 TypeScript、Vite 的 `@/` 別名。
- 新增 `components.json`、`src/styles/shadcn.css`、`src/components/ui/button.tsx`、`src/lib/utils.ts`。
- 使用 `tw:` 前綴，不引入全域 Preflight。僅對新 Button 的 `data-slot` 設定必要基礎樣式，避免原網站的文字色與瀏覽器按鈕邊框影響它。
- 現有頁面未改用新元件；課程資料、星座功能與四世界設計樣張均未修改。

這是元件庫整合，不是 UI 改版，也不是安裝另一套設計 skill。

## 使用方式

在 React 元件中：

```tsx
import { Button } from '@/components/ui/button'

<Button type="button" onClick={handleExplore}>探索課程</Button>
<Button variant="outline">查看課程</Button>
```

新增其他元件，在專案目錄執行：

```powershell
npx --yes shadcn@4.21.4 add dialog
```

不要重新執行 `init` 或直接套用全域 Preflight，以免改變既有版面。CLI 會依 `components.json` 產生帶 `tw:` 前綴的元件。後續元件仍需檢查與既有 CSS 的相容性，必要基礎樣式請限定於新元件，不重設整站。

目前官方生成器使用 `cn` 套件合併 class；本專案的 `@/lib/utils` 同樣匯出這個官方函式，已測試前綴 utility 的覆寫與狀態合併。

尚未將 shadcn 主題套用到原頁面。新元件預設為 neutral，支援 `.dark` 容器；實際採用時再配合頁面設計與手機操作尺寸調整。

## 驗證

- TypeScript／production build 通過。
- 全部 23 個測試檔、151 項測試通過，包含新增的 class 合併與 Button 測試。
- 本次修改檔案的 ESLint：0 error；官方 Button 同時匯出 `buttonVariants`，有 1 個 Fast Refresh warning，未更動整站 lint 規則。
- npm 安裝檢查：0 vulnerabilities。
- 原首頁 390×844、1280×900 安裝前後截圖已檢視；無控制台錯誤、橫向溢出或圖片載入失敗。
- 獨立 Button 樣張檢查 utility 排版、尺寸覆寫、邊框、文字色、主題背景、disabled opacity／pointer-events。

證據目錄：`doc/validation/shadcn-install-20261010/`，含 `before/`、`after/`、`button/`。

使用 `npm run dev` 啟動本機服務後，可透過服務網址開啟 `/doc/validation/shadcn-install-20261010/button-smoke.html` 檢視元件樣張；不要直接開本機 HTML 檔。

沒有提交、推送或部署。
