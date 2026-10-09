# 十二星座說明與四年課程交接｜2026-10-09

工程實作與自動化驗證完成；分類與文案仍是設計草案，尚未經學系審核。正確工作目錄：`E:\DEV\leearning-map`；環境預設的`E:\開發\leearning-map`是舊副本，不可混用。

## 使用者需求與成果

本輪完成Z-05～Z-07，延伸原十二星座功能：同課可跨星座出現、不硬限六門、四年均有配置，並用簡短說明解釋課程組合。

- 十二款都有一句標語與短介紹；探索頁可展開「為什麼是這些課程？」閱讀真實課程示例與該星座的連結角度。示例不自動加入收藏，也不冒充個人配對證據。
- 每組13–38門，四年均有相關課，全部69門至少被一組涵蓋；組內以ID去重，跨組允許重複。不為湊數改正式課名、年級、學期、學分、必選修或面向。
- 年級選單顯示各年課數；星圖與分頁清單顯示同一範圍。年級不是先修順序／正式修課安排，也不要求全部收藏。
- 課程卡多一行該星座的閱讀角度。例如course-046「自然書寫與生態文學」在金牛為自然與永續、雙魚為想像與敘事；完整內容見[v2分類表](ZODIAC_COURSE_MAPPING_v2.md)。
- 個人配對顯示配對星座的介紹；「配對怎麼來？」仍僅引用當事人實際收藏，另補相應角度。手動造型與課程配對清楚分開，不改收藏、不假稱選了未收藏的課程。
- 主課程地圖仍是核心。零收藏可探索十二主題，不看生日，不做人格／適性判定，不自動替學生選課。

## 分類與資料契約

`src/data/zodiacProfiles.json`升為版本2，保持`draft`；新增`tagline`、`description`、各標籤的`interpretations`與`exampleIds`，移除固定六門`starterIds`。十二款點線、權重、天蠍填入順序與原配對演算法不變。

主題範圍採「課程至少一個標籤與主要／延伸主題相符（既有權重≥2）」；權重1只是輔助意象，不能單獨納入課程。解析器驗證介紹／角度、合法且相關示例、十二組各自四年覆蓋與全69課聯集，並拒絕連續問號／替換字元造成的編碼損壞。

`zodiacCourseThemes.json`仍版本1；正式`courses.json`未改。資料版本2不等於存檔版本2：唯一`humanities-atlas:personal:v1`與同意／保存／移除／復原契約不變，未做storage migration。

## UI／路由與開發位置

本輪使用UX Architect與UI Designer skills，採漸進展開與原生手機操作，沿用深藍／柔白／香檳金token、44px點按星點與reduced-motion，不新增主模式、拖曳繪圖或重型動效。UX Architect附加`ai/agents/architect.md`缺失，依已讀主技能及現有架構實作。

- `src/config/zodiac.ts`、`src/data/zodiac.ts`：新版schema、主題範圍判斷與驗證。
- `src/lib/zodiac.ts`：`selectZodiacCourses`完整範圍／年級過濾、`zodiacCourseConnection`最強標籤角度；不動`matchZodiac`演算法。
- `src/components/CourseZodiacControls.tsx`：介紹、示例、個人證據與年級選單。
- `src/components/CourseAtlasApp.tsx`：相同課程ID供圖／清單使用，年級切換重設圖內星點小清單，主題翻頁聚焦`atlas-zodiac-courses-title`。
- `src/components/CourseAtlasResults.tsx`：短課程角度與`aria-describedby`；按鈕名稱不變。
- `src/lib/courseAtlasRoute.ts`：獨立`zodiacYear`／`mapZodiacYear`，不混用主地圖`mapYear`；不合法值安全回全部年級。
- `src/components/CourseAtlasConstellation.tsx`與`src/styles/course-atlas.css`：完整主題圖提示與既有token樣式。

從個人進入主題重設為全部年級；切換星座保留年級方便比較。全站搜尋後返回、詳情與URL／Back保留主題年級及分頁位置；主題瀏覽不寫個人存檔。收藏仍由原唯一personal reducer管理。

## 驗證與限制

- 145單元測試／21檔、typecheck、lint、format:check、主題JSON額外Prettier檢查、一般`npm run build`通過。
- [十二星座473組瀏覽器狀態](validation/course-atlas-zodiac-20261009/results.json)：十二型多尺寸／收藏數、390／1440×十二型×全部及四年逐頁完整ID、圖與清單同年級、介紹／示例、同課不同角度、焦點、搜尋返回、直連、舊存檔與320px＋200%文字，均通過且無runtime error。
- [原主地圖23組](validation/course-atlas-v2-20261009/results.json)、[個人星圖40組](validation/course-atlas-constellation-20261009/results.json)、[獨立天蠍原型27組](validation/scorpius-20261009/results.json)本輪重跑通過。個人回歸固定天蠍造型作基準，十二型另由新版套件覆蓋。
- 新版12個axe狀態（390／1440的配對／探索／理由／年級／圖鑑／詳情）與原有掃描無報告違規；這不是完整WCAG認證。
- [真實Chrome100%／200%縮放](validation/course-atlas-v2-20261009/browser-zoom.json)使用隔離臨時設定檔，不以CSS zoom冒充；十二造型無水平溢出／星點重疊。新版390／1440與320px＋200%文字截圖已目視檢查。
- tracked `git diff --check`與本輪新檔空白／替換字元檢查通過。原核定課程SHA256為`9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691`、原背景PNG為`AEB9020CDF7D7EDED29FF37B9ECB69CDECC96AD03D05E95A38ADDB54841F4404`，皆不變。

以上均為工程檢查，不是473位使用者研究。尚未驗證實體手機、Safari／Firefox、真實中文IME、螢幕閱讀器與真人學生易用性；學系需逐門審核分類及編輯文案。未新增套件、追蹤、存檔key、部署或commit；未清除使用者真實瀏覽器資料。

## 本機入口與歷史文件

<http://127.0.0.1:5186/>目前由dist隱藏Vite預覽程序提供，PID35344；不保證重新開機後在線。不停止不明5181／5182服務。

直接看金牛全部課程：<http://127.0.0.1:5186/?mapScreen=zodiac&mapZodiac=taurus>；直接看大三：<http://127.0.0.1:5186/?mapScreen=zodiac&mapZodiac=taurus&mapZodiacYear=3>。兩者都不攜帶或修改收藏。

更新頁面前可自行保存未儲存收藏，再重新整理。若5186沒在服務，可在正確目錄執行：

```powershell
Set-Location -LiteralPath 'E:\DEV\leearning-map'
npm run build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5186 --strictPort
```

重建前如需停止服務，只停止已核對command line屬於本專案5186的程序；不強制清除鎖住的舊`dist-atlas-v2`。

[任務進度](ZODIAC_STORY_TASK_PROGRESS.md)、[v2完整分類](ZODIAC_COURSE_MAPPING_v2.md)是現行依據。[v1分類](ZODIAC_COURSE_MAPPING_v1.md)已修復原中文編碼，保留原六課起點為歷史；[前階段交接](HANDOFF_2026-10-09_ZODIAC.md)的六課上限、測試數及PID不可當現況。
