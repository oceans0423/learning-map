# 星河互動樣板交接｜2026-10-09

> 已撤回：使用者要求回歸加入插圖與旋轉星河之前的星座版。現行狀態見 [復原紀錄](HANDOFF_2026-10-09_ZODIAC_RESTORE.md)。以下只保留歷史樣板紀錄，程式備份在 `doc/rollback/2026-10-09-before-zodiac-restore-3a5afb78/`，不代表目前介面。

## 本輪方向

使用者否定原四張抽象陶瓷插圖，改為面向高中生的「旋轉星河 → 鋪平 → 選擇星系 → 展開課程」體驗。本文件取代前一輪插圖整合文件作為目前 UI 方向。

已使用 beautiful-interactive-ui 的視覺、動效、實作驗證與課程星圖規範，將裝飾動效與真實課程選擇接在同一個場景。這是可操作樣板，尚不是經高中生試用確認的最終美術方向。

## 已實作

- 首頁改為一個錯落排列的星系場景，四個原生按鈕都有完整名稱與真實課程數：13／26／12／18。
- 星系使用程式繪製的螺旋、柔和光暈與星點；淡紫、珊瑚杏桃、青藍、薄荷綠配深靛藍。
- 裝飾星點不是課程節點，也不是可點選入口。沒有新增正式分類或先修關係。
- 桌機進場 1800ms；手機減少傾斜與旋轉，1400ms。只有背景場景旋轉，名稱與控制不旋轉。
- 同一個宇宙 DOM 留在原位：選領域後，選中的星系聚焦，其他領域變成可直接切換的入口。
- 各領域的四年分布由正式課程即時計算；數位人文為 3／3／4／2 門。
- 點年級立即篩選現有課程清單；再點同一年級回到四年全部。原生年級下拉選單與星圖按鈕同步。
- 課程詳情、搜尋、分頁、收藏與十二星座沿用既有流程與資料。
- 保留「跳過動畫／重看星河」「按年級看」「查看全部課程」。點領域或鍵盤聚焦入口可直接結束開場，不等待動畫。
- 在同一個 App 實例中，返回、切換年級視圖或搜尋後不重播；重新載入頁面可重新播放，也可主動重看。
- 減少動效可在執行中切換，會立即停止進場；頁面隱藏時也結束開場。沒有持續旋轉或閃爍。
- 裝飾場景獨立裁切，旋轉時不造成水平溢出，外層按鈕 focus 不被裁切。
- 手機保留正常上下捲動；聚焦後年級按鈕採 2×2，至少 44px。文字放大時，領域入口改成內容驅動清單。

原四張 PNG、WebP 與素材 manifest 完整保留在 `public/images/areas/`，目前首頁不引用或請求這些圖片。沒有產生新 AI 圖片、增加套件、推送遠端或部署。

## 程式邊界

- `src/components/CourseGalaxyScene.tsx`：場景、原生入口、進場控制、聚焦與四年分布。
- `src/styles/galaxy-scene.css`：星河底景、旋轉鋪平、圖像位置、手機與放大重排。
- `src/lib/galaxy.ts`：固定裝飾幾何與領域年級計數；`galaxy.test.ts` 測試資料契約。
- `src/components/CourseAtlasApp.tsx`：只在領域總覽／領域課程頁掛載場景，沿用 scope／filters／history；進入領域時聚焦 `galaxy-focus-title`。
- `src/components/CourseAtlasOverview.tsx`：領域入口改為星河；年級總覽保留原 SVG。
- 正式課程 JSON 未修改：SHA256 `9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691`。

## 驗證與證據

- 單元測試：150 項／23 檔通過；typecheck、正式 build、format:check 與 lint 通過。
- [星河專項](validation/galaxy-scene-20261009/results.json)：8 組通過，涵蓋進場、完成、跳過、重播、五種寬度、同一場景保留、精確年級課程 ID、鍵盤／觸控、詳情與 Back、重複切換、搜尋與減少動效。
- 320／390／768／1024／1440px 無水平溢出、操作目標至少 44px、不重疊；正常字級首屏可見搜尋與第一個完整領域入口。
- 390／1440px 總覽及領域聚焦的 Axe WCAG A／AA 自動檢查皆無違規，不代表完整人工可及性認證。
- 390px 200% 根字級可重排並選擇領域／年級；另執行真正 Chrome 100%／200% 縮放檢查。
- [既有課程流程回歸](validation/course-atlas-v2-20261009/results.json)：23 組全數通過，無 pageerror；全 69 個課程 ID 可經領域／年級／全部入口查到。回歸腳本僅更新被新設計替換的背景、資源與領域焦點預期，保留資料、儲存、詳情、搜尋與全鍵盤旅程驗證。
- 已實際檢視 [開場](validation/galaxy-scene-20261009/1440-opening.png)、[桌機總覽](validation/galaxy-scene-20261009/1440-overview.png)、[手機總覽](validation/galaxy-scene-20261009/390-overview.png)、[領域聚焦](validation/galaxy-scene-20261009/390-digital.png)、[文字放大](validation/galaxy-scene-20261009/390-text-200.png)。

環境為 Windows 系統 Chrome；手機 viewport、觸控與字級為模擬。實體手機、Safari、Firefox、真實手機鍵盤與高中生試用未驗證。沒有宣稱實體裝置幀率或最終審美驗收完成。

## 本機預覽

<http://127.0.0.1:5186/>。本次隱藏 Vite preview PID 為 `41804`；只供本次辨識，未來須重新確認。重新整理可看開場；完成後點「重看星河」可重播。

```powershell
Set-Location 'E:\DEV\leearning-map'
npm run build
npm run preview -- --host 127.0.0.1 --port 5186 --strictPort
```

驗證工具使用既有 npm 快取，未加入應用依賴：

```powershell
$galaxyPlaywright = 'C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright'
$galaxyAxe = 'C:/Users/user/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js'
node doc/validation/galaxy-scene.mjs $galaxyPlaywright http://127.0.0.1:5186/ $galaxyAxe
node doc/validation/course-atlas-v2.mjs $galaxyPlaywright http://127.0.0.1:5186/ $galaxyAxe
node doc/validation/course-atlas-zoom.mjs $galaxyPlaywright http://127.0.0.1:5186/
```

快取路徑日後可能改變；瀏覽器測試期間不要停止預覽或重建。

## 下一輪評估

先由使用者看開場與實際選課流程，再決定是否增加有生活線索的插畫細節。現階段課程閱讀區仍沿用原清單與篩選；後續可在確認方向後，整合重複的領域標題、返回入口與年級選擇，不必先重做收藏或星座功能。
