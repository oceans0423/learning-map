# UI／UX 改版交接｜2026-10-08

## 目前狀態

使用者要求：原本 UI／UX、配色與操作過於平凡。每個功能要有冒險、探索、未知與挖掘的興奮感，像即將踏入新世界。使用者下班，要求未完成時寫交接文件，回家接續。

已完成第一輪可運行的「人文探險圖譜」改版；尚未取得使用者對視覺方向的確認，完整互動、跨瀏覽器與正式部署仍待完成。請勿將此交接視為正式上線驗收通過。

## 唯一工作目錄與 GitHub

- 本次完整實作位於 `E:\DEV\leearning-map`。
- `E:\開發\leearning-map` 是另一份較早的骨架；請勿混用。該目錄沒有完整課程資料與這次改版。
- 私有 repository：<https://github.com/oceans0423/learning-map>，分支 `main`。
- 交接文件與本次改版一併提交推送；最新提交以 GitHub `main` 為準。
- 辦公室本機開發服務 `http://localhost:5173/`，只在那台電腦有效。回家需重新啟動。

## 回家啟動

首次取得專案：

```sh
git clone https://github.com/oceans0423/learning-map.git
cd learning-map
npm ci
npm run dev
```

若已有 clone，先確認自己的修改狀態，再在該 clone 執行 `git pull --ff-only` 與 `npm ci`。以 Vite 顯示的網址為準，預設 `http://localhost:5173/`。

## 已實作

1. **視覺與配色**：深海藍 `#102630`、暖金 `#e9c579`、珊瑚 `#eea08b`、青綠 `#83d6cd`。深色探索空間與暖色田野筆記交錯，詳見 `DESIGN.md`。
2. **首屏**：文案「世界還有很多，等你親自發現。」；新增 SVG 等高線圖、三個面向地標、虛線航線與羅盤。地標導向對應的結構控制，不複製分類篩選器。
3. **結構圖**：五區各有線描符號，滑入與選取回饋，選取後明示「已點亮」。保留複選 OR 邏輯。
4. **四年主線**：暖色手冊式呈現；各年級入口會展開對應課程並導向年級標題。
5. **課程地圖**：章節式年級展開、選修「展開更多可能」、學期切換與相關課程強調。
6. **課程卡／詳情**：卡片有方向箭頭、查看提示、位移回饋；詳情成為「課程探索筆記」。基本課程事實及內容核定條件未變更。
7. **可及性**：新增跳至課程地圖連結，維持 aria-pressed、aria-expanded、焦點圈及減少動效設定；既有 Escape、焦點鎖與歷史返回程式仍保留，但本輪尚未實機驗收。

## 主要檔案

| 檔案                                     | 用途                                   |
| ---------------------------------------- | -------------------------------------- |
| `DESIGN.md`                              | 本輪設計方向與原則，先讀再改 UI        |
| `src/styles/expedition.css`              | 全套新樣式；舊 `src/styles.css` 已移除 |
| `src/components/ExplorerAtlas.tsx`       | 首屏 SVG 探索地圖與錨點                |
| `src/components/ExplorationGlyph.tsx`    | 五個區域的線描圖示                     |
| `src/App.tsx`                            | 首屏、主線入口、結構導引、頁面編排     |
| `src/components/StructureDiagram.tsx`    | 唯一的面向／作用選取控制               |
| `src/components/YearAccordion.tsx`       | 年級、選修展開                         |
| `src/components/CourseCard.tsx`          | 課程卡與強調狀態                       |
| `src/components/CourseDetailsDialog.tsx` | 詳情、焦點鎖與 Escape                  |
| `src/config/tracks.ts`、`roles.ts`       | 淺底 accent、深底 signal 識別色        |
| `src/lib/urlState.ts`                    | URL 與瀏覽器返回策略，未於本輪更動     |

## 本輪驗證

- `npm run build` 通過（含 TypeScript 檢查）。
- `npm test`：5 檔、38 項全數通過；這些測試涵蓋資料與核心規則，並非瀏覽器互動測試。
- `npm run lint`、`npm run format:check` 通過。
- Chrome 本機截圖：桌機 1440×1000、手機 390×844，兩者成功呈現新版並已檢視。
- 手機截圖發現結構標題換行末尾落單，已以 mobile-only 斷行修正；最終修正後仍應在手機確認。
- 截圖僅存在辦公室電腦：`C:\Users\user\.gstack\projects\learning-map\designs\expedition-20261008\`；不在 GitHub，回家請直接開本機網站查看。

## 接續順序

1. 先讓使用者實際看新版，確認探索氛圍是否達到期待，再調整美感。此版本是第一輪實作，不是已核准定稿。
2. 檢查 320／390／768／1024／1440px：地圖標籤不重疊、頁面無橫向溢出、手機標題正確斷行、長課名與詳情仍清楚。
3. 操作地標、主線年級入口、年級／選修開合、學期切換、面向複選及清除；確保各控制與 URL 一致。
4. 驗證課程詳情的 Escape、焦點鎖、返回先關詳情、關閉後回課程卡；直接開帶 `course` 的網址也要測。
5. 檢查色彩對比、鍵盤、減少動效，及 Safari／Firefox／Edge。遇到問題就修正並針對改動驗證。
6. 系所確認四年主線文字、官方課表與系所網址；確認部署平台、網域、HTTPS、維護人，再處理錯誤頁與正式發布。

請保留課名、必選修、學期、學分等清楚事實；不要加入虛假解鎖、已完成或稀有度。使用者最早明確說核心是課程地圖要清楚，探索氛圍應服務這個目的。

## 環境注意

- 辦公室 Git 所在檔案系統不記錄 ownership，可能回報 dubious ownership；本輪用 `git -c safe.directory=E:/DEV/leearning-map ...` 的單次設定執行，未修改全域設定。回家正常檔案系統通常不需要。
- 正式 `E:\DEV` 目錄沒有 CodeGraph 索引；另一份 `E:\開發` 的索引不是這份專案。不要用錯索引推論新版程式。
- CUA 沒有可用瀏覽器，但 Chrome／Edge 實際存在於系統安裝位置。已用臨時 `npm exec --package=playwright --call "playwright screenshot --channel=chrome ..."` 完成截圖，未加入專案依賴。
- 新 UI 未部署，repo 仍為 private；推送不等於對外上線。
