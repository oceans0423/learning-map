# 四大領域插圖整合交接｜2026-10-09

> 本文件保留前一輪紀錄。插圖版與後續星河樣板均已撤回，目前回歸加入這兩項改動前的星座版，見 [復原紀錄](HANDOFF_2026-10-09_ZODIAC_RESTORE.md)。原素材完整保留，但首頁不再使用。

## 完成狀態與範圍

已完成首頁四大領域的插圖整合與本機驗證。實際專案為 `E:\DEV\leearning-map`；不是 `E:\開發\leearning-map` 的舊副本。

- 原始 PNG 保留，另產生 384／768px WebP，沒有新增套件。
- 僅領域卡片使用插圖；年級卡片保留原 SVG 與原課程數。
- 搜尋、課程詳情、個人收藏、十二星座與匯出功能均未修改。
- 正式課程 JSON 未修改：SHA256 `9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691`。
- 本次沒有提交、推送遠端或部署。

## 設計與操作

使用 beautiful-interactive-ui 與 UI Designer 技能，落實完整文字、圖像尺寸預留、原生控制、減少動效及文字放大重排。

- 桌機 2×2；手機為圖文並列的緊湊單欄，不新增全螢幕主視覺。
- 沿用午夜深藍、象牙陶瓷，以及領域的淡紫／杏桃／天藍／灰綠點綴。
- 圖片維持完整比例，以柔化邊緣融入卡片；不壓在文字後方。
- 點擊整張卡片立即進入領域課程，不必 hover、拖曳或收藏。
- 精準指標 hover／鍵盤 focus 時，插圖上移 3px，180ms 緩出；卡片與文字不位移。
- 按下以邊框與背景確認操作；reduced-motion 關閉圖片位移與 transition。
- 極窄的可用文字空間下，container query 把圖片移到文字下方，保持名稱完整。
- 圖片為裝飾：空 alt、aria-hidden、不可拖曳、不攔截指標；圖片載入失敗仍可使用原生入口。

## 素材與程式位置

原圖及網頁衍生檔位於 `public/images/areas/`。

| 領域 | 檔名主幹 | 課程數 |
| --- | --- | --- |
| 人文思維與方法 | humanities-thinking | 13 |
| 敘事與內容創作 | narrative-creation | 26 |
| 數位人文 | digital-humanities | 12 |
| 文化創意與社會設計 | cultural-social-design | 18 |

每個主幹有 `.png`、`-384.webp`、`-768.webp`。原圖皆為 1254×1254px；四張小尺寸合計 41,762 bytes，大尺寸合計 103,038 bytes。頁面使用 srcSet 選取尺寸，不載入 PNG；素材 URL 配合 Vite BASE_URL。

- `src/config/areaIllustrations.ts`：獨立的插圖對應，不更改官方分類 metadata。
- `src/components/CourseAtlasOverview.tsx`：僅領域卡片加入裝飾圖。
- `src/styles/course-atlas.css`：圖文比例、遮罩、有限動效與窄空間重排。
- `src/components/CourseAtlasOverview.test.tsx`：素材對應、裝飾語意、路徑與年級不變的測試。
- `doc/validation/optimize-area-illustrations.mjs`：可重跑的 WebP 產生器，檢查原圖 hash 不變。
- [素材 manifest](validation/area-illustrations-20261009/assets.json)：尺寸、位元組與所有來源／輸出 hash。

## 實際驗證

- 單元測試：148 項／22 檔通過。
- typecheck、lint、format:check、正式 build 通過。
- [插圖瀏覽器檢查](validation/area-illustrations-20261009/browser-results.json)：10 組通過，無 pageerror。
  - 320／390／768／1024／1440px：四圖正確解碼、文字與圖像不重疊、無水平溢出。
  - 正常字級首屏可見搜尋與第一張完整領域卡片。
  - 圖片觸控點擊、鍵盤 Enter、focus 外框、年級 SVG 原樣。
  - 減少動效、390px 200% 根字級、圖片請求失敗時仍可進入課程。
  - Axe WCAG A／AA 自動檢查：390／1440px 無違規；這不等同全面人工可及性認證。
- [既有課程流程](validation/course-atlas-v2-20261009/results.json)：23 組通過；全 69 個 ID 經領域／年級／全部入口均可查到，並驗證篩選、分頁、詳情、返回、收藏、搜尋等原有流程。
- [真正的 Chrome 100%／200% 縮放](validation/course-atlas-v2-20261009/browser-zoom.json)：首頁、詳情與十二星座切換無水平溢出，星座節點仍符合觸控尺寸。
- 已直接檢視 [桌機截圖](validation/area-illustrations-20261009/1440-overview.png)、[手機截圖](validation/area-illustrations-20261009/390-overview.png)、[200% 字級截圖](validation/area-illustrations-20261009/390-text-200.png)。

環境為 Windows 系統 Chrome；手機 viewport／觸控為瀏覽器模擬，不是實體手機。Safari、Firefox、實體手機與真實手機鍵盤未測試。未重跑完整 473 組星座專項測試，本次未改動星座程式。

## 本機預覽與重跑

本次預覽：<http://127.0.0.1:5186/>；隱藏 Vite preview PID 為 `11268`，供當次排查辨識，未來需重新確認 PID。已更新正式 build；若已開頁面，重新整理即可。

關閉後可重新啟動：

```powershell
Set-Location 'E:\DEV\leearning-map'
npm run build
npm run preview -- --host 127.0.0.1 --port 5186 --strictPort
```

本次使用的驗證工具位置與執行方式：

```powershell
$atlasPlaywright = 'C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright'
$atlasAxe = 'C:/Users/user/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js'
node doc/validation/optimize-area-illustrations.mjs $atlasPlaywright
node doc/validation/area-illustrations.mjs $atlasPlaywright http://127.0.0.1:5186/ $atlasAxe
node doc/validation/course-atlas-v2.mjs $atlasPlaywright http://127.0.0.1:5186/ $atlasAxe
node doc/validation/course-atlas-zoom.mjs $atlasPlaywright http://127.0.0.1:5186/
```

快取路徑日後可能失效；這些工具未加入應用依賴。先確認預覽正在執行，不要在瀏覽器測試進行中重建或停止服務。
