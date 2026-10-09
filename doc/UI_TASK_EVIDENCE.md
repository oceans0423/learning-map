# UI 任務開發與驗證紀錄

## UI-01｜現況與回歸基線

日期：2026-10-09（Asia/Taipei）  
狀態：**[x] 基線與 CodeGraph 結構確認完成。**  
範圍：只執行 UI-01；未開發 UI-02，未修改網站程式或正式課程資料，未部署。  
採用技能：beautiful-interactive-ui；依技能要求分開記錄自動檢查、實際畫面與瀏覽器操作，不能將測試通過直接當作新 UI 的可用性驗收。

### 1. 完成與待完成

- [x] 確認正式工作目錄、既有修改、package scripts 與課程統計。
- [x] 執行測試、型別檢查、lint、建置與格式檢查。
- [x] Chrome 桌機／手機尺寸基線、14 組操作檢查、10 張畫面。
- [x] 記錄舊 URL 的文件規格、實際重建／返回結果。
- [x] 依既有交接與檔案存在性建立候選修改落點。
- [x] 30 個應用／設定／資料檔案前後 SHA-256 一致。
- [x] 正式目錄 CodeGraph 初始化與 AST／符號落點確認。

索引確認已於最新「持續逐項完成」指示後補齊。以下初輪待索引的描述保留作歷史紀錄，精確確認以文末「UI-01 結構確認補記」為準。

### 2. 正式目錄與既有變更

正式專案：`E:\DEV\leearning-map`。環境預設的 `E:\開發\leearning-map` 是舊副本，本輪未使用其索引或程式。

開始時已存在：

```text
 M index.html
?? doc/DESIGN_CONSTELLATION_v1.md
?? doc/EXPLORATION_SIGNALS_v1.md
?? doc/UI.md
?? doc/UI_IMPLEMENTATION_TASKS_v1.md
?? doc/beautiful-interactive-ui.zip
?? public/
```

這些內容均保留。index.html 原有一行變更未修改；public/favicon.svg 未修改。Git ownership 只以單次 `git -c safe.directory=E:/DEV/leearning-map …` 處理，未改全域設定。

本輪新增的檔案都在 doc：此紀錄、驗證腳本與生成的驗證證據；任務指南僅更新 UI-01 狀態及紀錄入口。npm run build 生成忽略的 dist 建置產物，沒有部署。

保護範圍：src 全部已追蹤檔案、index.html、public/favicon.svg、package.json、package-lock.json、vite.config.ts、tsconfig.json，共 30 個檔案。前後比對 **0 個變更**：

- [開始雜湊](validation/ui01-20261009/source-hashes-before.json)
- [結束雜湊](validation/ui01-20261009/source-hashes-after.json)

### 3. 技術與資料基線

- package 宣告 React ^19.3.0、TypeScript ^5.8.3、Vite ^8.3.3。
- 實際執行 Node v22.14.0；Vitest v5.0.3；建置顯示 Vite v8.3.3。
- 瀏覽器使用系統 Chrome 154.0.8037.98，headless。
- Playwright 1.64.0 使用既有 npm cache，不新增專案依賴、不改 lockfile。
- 系統另有 Edge，但本輪沒有執行 Edge 操作驗收。

實際讀取並計算 src/data/courses.json：

| 項目 | 基線 |
| --- | ---: |
| 課程 | 69 |
| 必修／選修 | 15／54 |
| 資料列學分合計 | 138 |
| 基底／應用／整合 | 20／45／4 |
| 正式 primaryTrack 為空 | 24 |
| 八學期門數 | 6／6／11／12／11／12／7／4 |

24 門正式主要面向為空不等於課程缺失；新四訊號仍是後續獨立草案映射。本輪未建立或核定新映射。138 不是個人的畢業門檻或已修學分。

### 4. 自動檢查結果

| 指令 | 實際結果 |
| --- | --- |
| npm test | 通過；5 檔，38 項 |
| npm run typecheck | 通過，exit 0 |
| npm run lint | 基線通過；新增驗證腳本後再檢查通過 |
| npm run build | 通過，exit 0 |
| npm run format:check | 通過 |
| node --check doc/validation/ui01-baseline.mjs | 通過 |

建置輸出：index.html 1.49 kB、CSS 24.91 kB、JS 286.26 kB；gzip 約 0.59／6.02／81.56 kB。本輪不以此推算新介面的效能，也沒有執行依賴升級／audit 修復。

新增 Node／瀏覽器混合驗證腳本時，lint 曾指出腳本缺少 globals 宣告；已限於該腳本補齊註解並重跑通過，未改 ESLint 全域設定。這不是應用程式原有錯誤。

### 5. 程式落點與沿用／替換邊界

**證據限制：** 下表用途取自既有交接／任務文件；本輪確認對應檔案存在、雜湊保留。因 CodeGraph 尚未初始化，未用舊索引，也未以原始碼搜尋替代結構查詢；符號、呼叫關係及最新實作邊界仍待確認。下表不能當成 AST 已驗證的架構結論。

| 實際存在的檔案 | 文件記錄／候選用途 | 後續處理 |
| --- | --- | --- |
| [main.tsx](../src/main.tsx) | 前端進入點（檔案已存在） | 預計沿用；符號／匯入待確認 |
| [App.tsx](../src/App.tsx) | 頁面編排、首屏、主線及導引 | UI-05 整合工作台；不重建專案 |
| [ExplorerAtlas.tsx](../src/components/ExplorerAtlas.tsx) | 首屏 SVG 探索圖 | 收斂或複用視覺語彙，不繼續垂直堆重複圖 |
| [StructureDiagram.tsx](../src/components/StructureDiagram.tsx) | 既有五區作用／面向控制 | 保留正式資料語意；UI-08 的四訊號另設 |
| [YearAccordion.tsx](../src/components/YearAccordion.tsx) | 多年級／選修展開 | UI-06 的總覽／學期星圖取代主要長頁展開 |
| [CourseCard.tsx](../src/components/CourseCard.tsx) | 課程事實與查看入口 | 沿用資料呈現原則；新節點／清單需重新布局 |
| [CourseDetailsDialog.tsx](../src/components/CourseDetailsDialog.tsx) | 詳情、Escape、焦點鎖 | UI-07 沿用已驗證的事實與返回規則，再重組桌機／手機 |
| [expedition.css](../src/styles/expedition.css) | 目前探索風格樣式 | UI-03～05 漸進整理 token／布局 |
| [tracks.ts](../src/config/tracks.ts)、[roles.ts](../src/config/roles.ts)、[focus.ts](../src/config/focus.ts) | 既有正式面向／作用／控制設定 | 不改解釋成新訊號；詳細字面值待查核 |
| [courses.json](../src/data/courses.json)、[courses.ts](../src/data/courses.ts) | 資料與載入／驗證候選落點 | 核定 JSON 保留；載入／驗證符號待確認 |
| [course.ts](../src/types/course.ts) | 課程型別候選落點 | 原型別延續，新映射另加型別 |
| [semester.ts](../src/lib/semester.ts)、[highlight.ts](../src/lib/highlight.ts) | 學期／正式強調規則候選落點 | 原規則不要改寫；新訊號匹配獨立 |
| [urlState.ts](../src/lib/urlState.ts) | URL／歷史策略 | UI-01 待確認完整語意；未來保留舊參數相容性 |
| [learningPath.ts](../src/data/learningPath.ts) | 四年主線資料候選落點 | 必要敘事保留，不用新動效取代內容 |

既有測試檔案均存在：courses.test.ts、learningPath.test.ts、highlight.test.ts、semester.test.ts、urlState.test.ts。5 檔測試已通過，但逐項測試名稱、源碼覆蓋與符號關聯未作 AST 查核。

完成 CodeGraph 初始化後，只需對正式專案先查 focused context，再一次 explore 相關符號，補上精確落點／沿用邊界。不要重做本輪已完成的數據與畫面基線。

### 6. 舊 URL 的規格與已操作案例

規格依據：PRD v1.2 §6.6；實際案例在 [瀏覽器結果](validation/ui01-20261009/browser-results.json)。

| 參數 | 舊用途 | 本輪實際確認 |
| --- | --- | --- |
| sem | 全年／上／下學期 | 預設全年；點下學期寫 sem=2；不合法回全年顯示 |
| focus | 正式作用／面向，不是新四訊號 | foundation,narrative 可複選；清除不改 sem=2 |
| open | 多個年級展開 | open=1,2 重建兩年；全部展開得到 open=1,2,3,4 |
| course | 開啟指定課程詳情 | course-007 點選、course-010 直接網址；關閉移除該參數 |

代表性原網址：

```text
/?sem=2&focus=foundation,narrative&open=1,2&course=course-010
/?sem=2&focus=foundation,narrative&open=1,2
/?open=1,2,3,4
/?sem=bad&focus=bad&open=bad&course=unknown
```

文件規格要求：控制項 replaceState、詳情 pushState、返回先關詳情。本輪實際確認開啟後返回會關閉詳情、直接網址 reload 能復原、直接開啟再關閉不離開網站。未逐條驗證全部歷史深度／每種 focus 值／所有課程 ID；源碼層的策略確認留待 CodeGraph。

無效參數會讓畫面安全回預設，原不合法 query 仍可能留在網址；不把這個基線行為誤報為網址已自動正規化。

### 7. 瀏覽器基線與截圖

主要操作測試使用 npm run build 的產物與 Vite preview，地址為 `http://127.0.0.1:5182/`。另確認正式目錄 Vite dev `http://127.0.0.1:5181/` 可載入正確標題與 69 個課程節點。

| 範圍 | 結果 |
| --- | --- |
| 桌機 1440×1000，滑鼠點按 | 7 組通過 |
| 手機 390×844，Chrome touch／viewport 模擬 | 7 組通過 |
| pageerror | 兩組均 0；不等於已檢查所有 console／網路訊息 |
| 預設畫面橫向溢出 | 兩尺寸均未發現 |
| 可見課程 | 預設 4 門必修；全部展開 69 門 |
| 詳情焦點 | 移入成功；Tab／Shift+Tab 不逸出；Escape／關閉／返回回原課程 |
| 核定顯示 | 課程事實可見，未核定內容維持整理中 |
| 直接網址、reload、無效參數 | 本輪案例通過 |

七組流程：初始畫面、全部課程展開、學期／複選／清除、詳情／Escape／焦點、關閉鈕／Back、直接網址／reload／安全關閉、無效參數容錯。手機使用 tap，不是實體手機；Escape 等鍵盤檢查亦在模擬環境執行。

截圖生成與本輪已檢視的代表畫面：

- [桌機首屏](validation/ui01-20261009/desktop-home.png)
- [桌機全頁](validation/ui01-20261009/desktop-full.png)
- [桌機地圖](validation/ui01-20261009/desktop-map.png)
- [桌機全部展開地圖視窗](validation/ui01-20261009/desktop-expanded-map.png)
- [桌機詳情](validation/ui01-20261009/desktop-details.png)
- [手機首屏](validation/ui01-20261009/mobile-home.png)
- [手機全頁](validation/ui01-20261009/mobile-full.png)
- [手機地圖](validation/ui01-20261009/mobile-map.png)
- [手機全部展開地圖視窗](validation/ui01-20261009/mobile-expanded-map.png)
- [手機詳情](validation/ui01-20261009/mobile-details.png)

其中桌機首屏、手機地圖、手機詳情已直接視覺檢視；其他是可回查的截圖證據，不宣稱十張都已逐像素審核。截图停用動效是為穩定構圖，不能由此宣稱動效已流暢。

### 8. 已確認的改版問題

| 指標 | 桌機 | 手機 |
| --- | ---: | ---: |
| 預設全頁高度 | 3,637 px | 6,107 px |
| 預設地圖高度 | 約 1,393 px | 約 1,790 px |
| 全部展開全頁高度 | 8,731 px | 18,943 px |
| 全部展開地圖高度 | 約 6,487 px | 約 14,626 px |

年級／選修全開會把地圖拉得很長，用戶反馈已由實際尺寸重現；UI-05／06 應將它改成有出口的聚焦工作台，而非用更多發光效果掩蓋。

核定 primaryTrack 空值 24 門與目前「基底／整合無主要面向」的卡片呈現有關，不能直接判定資料漏課；UI-02 新探索訊號與正式作用獨立，需另行驗證。

現有詳情關闭、焦點與历史基线表现正常，應作為 UI-07 回歸保護，而不是不加分辨地全部重寫。

### 9. 環境問題與重跑方式

- PowerShell 中 `npm run dev -- --host … --port …` 的參數曾被 npm 消耗，導致 Vite 收到錯誤的位置參數。改用本機 vite.cmd 入口后正常啟動；未修改 npm／專案設定。
- 初次 dev 導航以 networkidle 等待曾超過 30 秒；随后以 domcontentloaded 與實際控制項就緒確認成功。未將單次等待逾時推斷為程式根因。
- 瀏覽器腳本接受既有 Playwright 路徑，避免為驗證新增依賴。
- 未測 Edge、Safari、Firefox、實體手機、360／768 等其他尺寸、200% 文字、完整鍵盤找課、reduced-motion 及學生直覺性。它們仍屬後續任務，不因本輪基線通過而標已驗收。
- 本輪測試服務僅綁 localhost，未公開網站；結束時關閉本輪新增的 5181／5182 服務，不影響使用者原有服務。

重跑（第一個終端機）：

```powershell
Set-Location -LiteralPath 'E:\DEV\leearning-map'
npm run build
.\node_modules\.bin\vite.cmd preview --host 127.0.0.1 --port 5182 --strictPort
```

第二個終端機，將 Playwright 路徑換成仍存在的既有安裝：

```powershell
Set-Location -LiteralPath 'E:\DEV\leearning-map'
node doc/validation/ui01-baseline.mjs 'C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright' http://127.0.0.1:5182/
```

腳本：[ui01-baseline.mjs](validation/ui01-baseline.mjs)。重跑會更新此輪診斷的截图／browser-results.json；不更動應用或課程資料。

### 10. 下一步與依賴

尚需使用者確認是否在正式目錄執行 `codegraph init -i`。MCP status 本輪回報 not initialized；CLI 已確認存在，但沒有自行初始化。

獲准後完成索引 → context／explore 精確程式落點 → 補記此紀錄 → UI-01 才改為 [x]。本輪不接續 UI-02。

本輪變更：

- 新增 doc/UI_TASK_EVIDENCE.md。
- 新增 doc/validation/ui01-baseline.mjs。
- 新增 doc/validation/ui01-20261009/ 的結果 JSON、前後雜湊及 10 張截圖。
- 更新 doc/UI_IMPLEMENTATION_TASKS_v1.md 的 UI-01 狀態／紀錄入口。

## UI-01 結構確認補記（2026-10-09）

最新使用者要求在上班期間持續逐項完成。本輪明示以此授權執行必要本機索引初始化，並在正式 E:\\DEV\\leearning-map 執行 codegraph init -i。索引正常：25 檔、197 nodes；MCP status 顯示 384 edges。未使用舊副本索引，未修改原應用檔案。CLI 初次輸出與 MCP 後續 edges 數不同，這裡依完成後 status 記錄。

透過 context／explore 確認的關鍵落點：

| 符號 | 精確位置 | 延續邊界 |
| --- | --- | --- |
| App | src/App.tsx:20 | mapState 與 popstate 同步；新工作台需保留狀態一致性 |
| toggleYear／changeSemester／toggleFocus | src/App.tsx:35／49／55 | 呼叫 replaceUrlState，不額外堆歷史 |
| openCourse／closeCourse | src/App.tsx:44／70 | 呼叫 pushCourseUrlState／closeCourseUrlState |
| parseCourses／courses | src/data/courses.ts:73／85 | 載入驗證、重複 ID 檢查與唯讀課程來源 |
| Course | src/types/course.ts:22 | 正式欄位完整，新訊號不得覆寫 primaryTrack／relatedTracks／verification |
| getVisibleCourses | src/lib/semester.ts:13 | all 或 1／2 的正式學期規則 |
| isCourseHighlighted | src/lib/highlight.ts:6 | 正式 role／track OR；空條件不高亮，不等同新訊號 |
| parseUrlState | src/lib/urlState.ts:30 | sem 1／2／all，focus 去重、有效年級 1～4、有效 course ID |
| serializeUrlState／replaceUrlState | src/lib/urlState.ts:58／89 | 正式 URL 值與 replaceState 行為 |
| closeCourseUrlState | src/lib/urlState.ts:131 | 站內詳情有 history marker 才 back；直接網址只 replace 清課程 |
| CourseDetailsDialog | src/components/CourseDetailsDialog.tsx:10 | Escape、Tab 邊界、背景捲動與來源焦點清理 |
| hasApprovedDetails／欄位條件 | src/components/CourseDetailsDialog.tsx:73 起 | summary／activities／possibleOutputs 各自核定才顯示 |

UI-01 現已完成。UI-02 以獨立資料與規則開始，原課程 JSON／既有 URL 工具先不改；後續各項狀態與證據追加於本檔。若新元件／修改檔案出現索引 staleness banner，只讀指定 pending 檔案，不重新用全文搜尋推翻新鮮 AST 結果。
