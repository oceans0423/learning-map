# UI 開發交接｜2026-10-09

正式工作目錄：`E:\DEV\leearning-map`，不要在舊副本 `E:\開發\leearning-map` 接續。

## 結果與狀態

UI-01～UI-18 開發與工程驗證完成。UI-19 雙旅程工程回歸完成，但學生與實機驗證沒有執行，任務指南仍保留 `[~]`，不宣稱直覺性或全裝置流暢已被證實。

依 beautiful-interactive-ui 技能落實有限、可取消的動效，可見方向按鈕與鍵盤／觸控等價操作，以及實際瀏覽器畫面驗證；未增加正式字體或動效依賴。

找課是主要旅程：四年總覽→單學期→課程筆記；手机每組最多6門，桌機最多12門，完整69門清單與跨年搜尋始終可用。不收藏也能完成全部找課操作。

選用創作旅程：收藏不限8門、最多69門；個人星座最多8顆代表星，可以明確替換、命名、拖曳或按方向調整、取消還原、自願本機保存、下載獨立SVG。一顆也能完成，不必收齊八顆。

## 本機開啟

目前運作的開發版：[http://127.0.0.1:5181/](http://127.0.0.1:5181/)。

目前運作的正式build預覽：[http://127.0.0.1:5182/](http://127.0.0.1:5182/)；最終雙旅程回歸測此版本。

若服務已結束，在PowerShell進入正式目錄後啟動：

```powershell
Set-Location -LiteralPath 'E:\DEV\leearning-map'
.\node_modules\.bin\vite.cmd --host 127.0.0.1 --port 5181 --strictPort
```

要看build預覽，另開終端：

```powershell
Set-Location -LiteralPath 'E:\DEV\leearning-map'
npm run build
.\node_modules\.bin\vite.cmd preview --host 127.0.0.1 --port 5182 --strictPort
```

只綁127.0.0.1，不開放區網、不部署。瀏覽器存檔依同一瀏覽器及網站origin區隔：5181、5182、localhost與127.0.0.1不是同一存檔空間。建議固定使用同一網址；需要帶走作品請下載SVG。

## 保存與匯出契約

- 未同意不寫新個人資料；有效既存同意才還原，不自動開編輯器。
- key：`humanities-atlas:personal:v1`，保存收藏、代表身份／座標、名称与初始化／完成狀態；不保存undo或介面提示。
- 停用保留當前草稿，將舊存檔同意設false；舊快照不更新、不自動還原。獨立確認刪除只移除此key，當前草稿仍在。
- JSON／版本／未知ID／子集與上限／有限有界座標／24 grapheme都驗證；壞資料不默默覆寫。讀取、quota、停用、刪除失敗均有文字，不假成功。
- SVG依已提交位置／名稱匯出，移動預覽時禁用；名稱輸入後先更新名稱。固定檔名 `my-humanities-constellation.svg`，object URL會清理。
- SVG有完整課名／年級圖例，無腳本、外部資源、HTML或雲端；連線是個人探索想像，不是先修、已修課、能力評分或官方推薦。
- 不含PNG、分享連結、多星座、帳號、跨裝置同步或選課系統。

## 接手程式位置

| 範圍 | 位置 |
| --- | --- |
| 主入口與工作台 | src/App.tsx、src/components/WorkbenchApp.tsx |
| 學期地圖／搜尋／課程筆記 | SemesterAtlas.tsx、CourseSearch.tsx、CourseDetailsDialog.tsx |
| 正式資料與新導覽草案 | src/data/courses.json、explorationSignals.json；src/config/explorationSignals.ts |
| 收藏及星座資料狀態 | src/lib/collection.ts、personal.ts、constellation.ts |
| 星座選取／命名／構圖 | ConstellationEditor.tsx、ConstellationNaming.tsx、ConstellationArt.tsx |
| 移動與取消 | src/lib/starPosition.ts、useStarMovement.ts |
| 本機保存 | personalStorage.ts、usePersonalStorage.ts、PersonalStorageControls.tsx |
| SVG | constellationSvg.ts、ConstellationExport.tsx |
| 樣式／token | src/styles/constellation-tokens.css、buttons.css、workbench.css、atlas.css、motion.css、collection.css、constellation.css |
| 回歸證據與驅動程式 | doc/validation/ |

上述縮寫元件路徑皆在src/components；資料／hook皆在src/lib。舊App保留為LegacyApp遷移參照，正式App使用WorkbenchApp。

CodeGraph已初始化並同步到正式目錄。結構查詢使用對應projectPath；新增／修改符號未入索引時執行本機 `codegraph sync`，不使用舊副本索引。

## 實際驗證

最終77項單元測試、typecheck、lint、build、format:check通過。正式課程原檔SHA256仍為：

`9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691`

69課、必修15／選修54、列示學分138、正式作用20／45／4都未改；138不是畢業學分承諾。24門正式primaryTrack為null是原正式資料，不是漏課。新四訊號20／14／10／21，另4門開放匯流、50次訊號，獨立draft，不冒稱核准分流；未核定新增詳情仍不公開。

測試環境：Windows、Intel i9-13980HX、system Chrome154.0.8037.98、headless，手機viewport／touch注入屬模擬，不是實機。

| 驗證 | 證據 |
| --- | --- |
| 兩旅程×mouse／tap／Tab鍵盤／reduced-motion、5宽度低高度200%文字、保存／刪除失敗仍能匯出 | [UI19結果](validation/ui19-20261009/results.json) |
| 最終編輯器文字各67筆、透明gradient最亮合成背景與必要連線3.18:1 | [對比](validation/ui19-20261009/contrast.json) |
| 真實滑鼠／Chrome touch拖曳、輕點、方向／Enter、Esc／取消／失焦／resize／pointercancel／lostcapture、移除正在編輯的星體 | [UI16結果](validation/ui16-20261009/results.json) |
| 未同意無寫入、保存／重載、停用後第二頁不還原、刪除確認、quota／blocked／壞JSON | [UI17結果](validation/ui17-20261009/results.json) |
| 兩寬度×1／2／8顆、24文字／家庭emoji、特殊符號，真下载後system Chrome file URL開啟；無外部HTTP、文字getBBox不裁切 | [UI18結果](validation/ui18-20261009/results.json) |
| 69門最大收藏／取消／最近undo、map不被摘要推移、未保存reload清空 | [UI12回歸](validation/ui12-20261009/results.json) |
| 0／1／8／9／69收藏、替換取消、代表同步移除／undo、重新進入保留 | [UI14回歸](validation/ui14-20261009/results.json) |
| 建構後找課主流程與5宽度長課名200%文字 | [找課回歸](validation/ui11-20261009/build-results.json) |

UI19目錄有兩旅程錄影、五尺寸200%截圖與實際下載SVG；UI18目錄有六個開啟的SVG和對應截圖。390編輯器與八顆SVG已實際目視，不以單元測試替代畫面檢查。

效能仍有風險：錄影回歸桌機曾66.7ms、手機touch17.4ms，無longtask；獨立無錄影曾49.9／66.9ms，最後附逐幀數據的測量33.4／50.1ms，多數約16.7ms。見[拖曳樣本](validation/ui19-20261009/drag-benchmark.json)。UI10手機約83ms交接幀同樣保留待確認。不能據此保證實機全程流暢，也沒有拿最佳單次樣本當結論。

測試驅動使用現有npm快取的Playwright及system Chrome，未增加專案測試依賴；若換電腦需自行提供Playwright位置。測試FFmpeg安裝曾回收兩個舊Playwright Chromium快取，system Chrome未受影響；舊快取可重新下載，往後安裝設定 `PLAYWRIGHT_SKIP_BROWSER_GC=1`。

## 尚待驗收，不擅自代辦

1. 學生不先解說走兩條旅程：是否能找到課程／筆記入口、理解訊號是草案、忽略收藏、分辨8代表星與69收藏；記錄障礙再修改。
2. 真實手機與Safari／Firefox：中文IME、手機鍵盤、旋轉、焦點／抽屜、拖曳開始長幀、系統reduced-motion、SVG與storage限制。
3. 內容負責人核定四個新訊號的對外採用與標示。官方連結、原四年主線走查、正式網域與部署責任仍屬原發布待辦。

未安排外部受試者、未聯絡學生、未部署、未公開、未commit/push。使用者原favicon與既有未追蹤文件／技能ZIP保留；測試刪除的只是隔離context內測試存檔，沒有清除使用者瀏覽器資料。

逐項歷程：[UI_TASK_PROGRESS.md](UI_TASK_PROGRESS.md)。任務指南：[UI_IMPLEMENTATION_TASKS_v1.md](UI_IMPLEMENTATION_TASKS_v1.md)。
