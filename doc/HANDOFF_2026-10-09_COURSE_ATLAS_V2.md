# 課程地圖 v2 交接｜2026-10-09

正確工作目錄：`E:\DEV\leearning-map`。`E:\開發\leearning-map` 是較早副本，不能混用。

## 後續十二星座擴充

本文件下方主要記錄MAP-01～07固定天蠍座階段；使用者後續已授權十二星座與依選課配對，並完成十二款介紹與四年完整課程範圍。最新功能、分類草案與驗證請看[星座說明與四年課程交接](HANDOFF_2026-10-09_ZODIAC_STORIES.md)、[最新任務進度](ZODIAC_STORY_TASK_PROGRESS.md)、[v2完整分類](ZODIAC_COURSE_MAPPING_v2.md)。目前星圖動作為「找到我的星座」，新增「探索十二星座」；每組13–38門、非固定六門，可依年級查看。原主地圖及v1個人存檔契約不變。

## 本機入口

- 新版主站：<http://127.0.0.1:5186/>（本機正式build預覽，不是部署）。
- 舊工作台比較：<http://127.0.0.1:5186/?ui=legacy>。
- 原天蠍座獨立原型：<http://127.0.0.1:5186/#scorpius>，保留相容，不在新版主要導覽宣傳。

`App`預設已進新版。原本5181／5182服務沒有被停止；本輪曾另啟5183／5184測試服務，已停止本輪服務。5186是目前保留的隱藏預覽程序。重開機或程序結束後需重啟，不保證網址永遠在線。

```powershell
Set-Location -LiteralPath 'E:\DEV\leearning-map'
npm run build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5186 --strictPort
```

若5186已在使用，不啟動第二份；重新整理現有頁面即可。開發可使用`npm run dev`，以Vite實際顯示的網址為準。

更新前若有未保存的收藏，請先自行按「儲存在這台裝置」，再重新整理；不強制開啟保存同意。新版操作：收藏課程 → 我的課程 → 找到我的星座；也可不收藏，先探索十二星座。

## 已實作主線

MAP-01～MAP-05：四領域前台名稱與資料查詢、深藍頁框、領域／年級同區切換、領域／年級／全部共用結果、6／12門分頁、交集篩選、真正可開啟的全站搜尋、共用詳情與URL／Back／焦點來源。

主站不再顯示四訊號卡、星圖／清單／收藏／編輯器四重主模式或天蠍座宣傳按鈕。四領域星群是可點按的完整入口；主課程結果沒有任意連線，不暗示先修。前台「敘事與內容創作」對應正式module「文學創作」，原分類不改寫。

課程詳情優先呈現基本事實與領域；作用與正式面向收為補充，draft課程簡介仍不呈現。手機底部modal／桌機非modal共用原可及底盤。抽屜沒有整層文字淡入，避免進場期間對比下降；只做短位移，reduced-motion取消。

「我的課程」預設清單，保留從詳情加入／移除、最近復原與既有本機保存；MAP-06已接上「用星座呈現」，直接以同一份收藏IDs生成固定天蠍座。單課星點直開詳情，多課星點展開區域清單；完整課程清單仍用6／12門分頁。已有舊代表星的人可以查看既有作品；新站不呼叫initialize、不改名或重排舊作品。主動移除課程仍遵守既有代表星同步移除／復原契約。

## 本輪確認與邊界

使用者已確認主地圖「現在很OK」，並指出收藏後缺少星圖生成；依此完成MAP-06與MAP-07個人功能工程回歸。真實手機與學生試用仍未完成；不要將使用者的方向確認寫成真人可用性研究。

新版星座呈現沒有原型的另一套搜尋／勾選全課程流程。獨立`#scorpius`比較原型保留原行為，不在新主流程推廣。十二星座與主題配對是後續授權擴充，見上方交接；命名擴充、隨機、下載／分享與多作品仍不在此次新增範圍。

## 程式邊界

| 檔案                                          | 責任                                       |
| --------------------------------------------- | ------------------------------------------ |
| `src/config/courseAreas.ts`                   | 正式module／前台名稱／色彩映射與年級名稱   |
| `src/lib/courseAtlas.ts`                      | 去重、交集篩選、穩定排序、統計與錨點分頁   |
| `src/lib/courseAtlasRoute.ts`                 | 新map參數、舊連結映射、詳情history標記     |
| `src/components/CourseAtlasApp.tsx`           | 主流程、個人狀態重用、來源與返回協調       |
| `src/components/CourseAtlasShell.tsx`         | 緊湊標頭、搜尋、IME提交保護、主要導覽      |
| `src/components/CourseAtlasOverview.tsx`      | 四領域／四年總覽及SVG裝飾                  |
| `src/components/CourseAtlasResults.tsx`       | 共用結果、篩選、分頁、resize與課程入口     |
| `src/components/CourseAtlasConstellation.tsx` | 收藏的固定造型投影、可點星點與小型分組清單 |
| `src/styles/course-atlas.css`                 | 局部深藍樣式、響應式背景、詳情與有限動效   |

既有檔的本輪增量：`App.tsx`預設入口／比較入口；`CourseDetailsDialog.tsx`選用atlas資訊層級與焦點備援；`PersonalStorageControls.tsx`可選h3層級；`usePersonalStorage.ts`失敗文案不再提示當前頁不存在的SVG出口；`vite.config.ts`只擴充CSS測試載入。

新URL使用`mapView/mapScope/mapYear/mapArea/mapSemester/mapType/mapAnchor/mapMineAnchor/mapSearchAnchor/mapQuery/mapScreen`；`course`保留課程ID語意。`ui`僅為比較入口。正式focus與訊號不重新解釋，舊連結有相容提示，新導航不再保留隱形舊限制。來源頁次／搜尋與個人清單的頁次分開，清除搜尋不清收藏。

主導覽焦點在`useLayoutEffect`中完成，避免延後的animation frame打斷Tab操作。跳至內容只負責當次native fragment focus；新路由不再攜帶`#atlas-content`，避免Back／Escape時瀏覽器fragment還原覆蓋來源課程焦點。其他hash仍保留。

新增`mapScreen=constellation`，與mine共用IDs／mineAnchor，不增加存檔key。全站搜尋後清除可回原星圖。星點來源使用穩定id，分組課程來源使用`data-star-course`；小清單不是第二層modal，不和共用詳情形成巢狀dialog。星圖容器有窄寬container query，放大文字後仍確保44px目標不重疊；不支援container query的瀏覽器回退到較高的靜態圖。

## 背景素材

- 使用者原PNG保留：1,487,597 bytes，SHA256 `aeb9020cdf7d7eded29ff37b9ecb69cdecc96ad03d05e95a38addb54841f4404`。
- 桌機`minimal-deep-blue-starfield-desktop.webp`：1600×900、14,232 bytes。
- 手機`minimal-deep-blue-starfield-mobile.webp`：800×450、5,264 bytes。
- 新站CSS在手機只載入手機WebP；不重新生成星雲或動物插畫。壓縮版本已目視查看，原圖保持不變。
- 重現腳本：`doc/validation/optimize-atlas-starfield.mjs`，使用本機Chrome canvas編碼，不新增依賴。

## 驗證證據與邊界

目前已通過104項單元測試，包含15項地圖v2新增測試；lint、typecheck、format:check、一般npm run build與git diff --check通過。主線瀏覽器23組及星圖40組全部通過；兩份`results.json`明記`passed: true`、`failure: null`，所有測試頁面零runtime error。最新狀態以[MAP進度](MAP_TASK_PROGRESS.md)及下列證據為準，不以此段取代最新腳本結果。

- `doc/validation/course-atlas-v2-20261009/results.json`：五尺寸全69 ID覆蓋、搜尋／詳情／Back、未同意不寫入、真觸控注入與合成composition事件、舊存檔還原、保存失敗、背景失敗、有限效能樣本與補充鍵盤／resize／低高度。
- 同目錄390／1440總覽、結果與詳情截圖，已目視檢查。
- `doc/validation/course-atlas-constellation-20261009/results.json`：五尺寸與六種收藏量、全ID星點／分頁清單、切換／Back、分組與來源焦點、keyboard／touch、最後移除與復原、搜尋往返、圖片／保存失敗、舊作品不變；同目錄390／1440星圖截圖已目視檢查。
- 同目錄`browser-zoom.json`：隔離Chrome profile的真實200%瀏覽器zoom，1414→707 CSS px、DPR1→2、CSS字級仍16px；不靠CSS zoom、改字級或device scale冒充。
- 同目錄`background-assets.json`：素材尺寸、檔案量與雜湊。
- `doc/validation/scorpius-20261009/results.json`：原型27組回歸，在5186新build重跑，零runtime error。
- 八個主地圖與六個星圖axe狀態無報告違規，不是完整WCAG符合證明；原型掃描也只是所測狀態。

效能樣本為Windows system Chrome、本機預覽、無CPU節流，紀錄完整frame deltas與資源timing；不拿這個數字保證真實手機流暢度或公開網路載入時間。真人學生、真實手機、Safari／Firefox、實際軟鍵盤／IME與真人讀屏尚未測。

執行（使用既有測試快取，不新增package）：

```powershell
node doc/validation/course-atlas-v2.mjs C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright http://127.0.0.1:5186/ C:/Users/user/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js
node doc/validation/course-atlas-zoom.mjs C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright http://127.0.0.1:5186/
node doc/validation/course-atlas-constellation.mjs C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright http://127.0.0.1:5186/ C:/Users/user/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js
```

快取路徑僅對目前本機有效，搬移專案需另提供Playwright／axe路徑。全部瀏覽器驗證使用隔離context或新臨時profile，不動使用者真實瀏覽器資料。

## 環境與保存提醒

本輪首次清理建置輸出遇Windows ENOTEMPTY／EPERM；停止本輪新增的監看／測試服務後，一般dist建置已成功。另有本輪的`dist-atlas-v2`臨時輸出子目錄仍被Windows鎖住，已在git與lint排除，未改權限或強制遞迴刪除；它不是正式預覽來源，不能當最新版本。不要為清理它刪除專案根目錄或停止不明服務。

正式課程原檔SHA256仍為`9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691`。沒有部署、commit、推送、清除真實個人存檔或新增存檔key。原有大量dirty／untracked修改保留；不要用git reset／checkout清掉它們。
