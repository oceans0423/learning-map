# 四領域課程地圖｜創作現場操作樣張

日期：2026-10-10。獨立視覺切片；尚未接入正式網站。

## 開啟與操作

在瀏覽器開啟 [本機預覽](http://127.0.0.1:8776/doc/design/four-worlds-20261010/creative-studio/index.html?area=digital)。這是頁面，不是程式碼檢視。

也可將 `E:\DEV\leearning-map\doc\design\four-worlds-20261010\creative-studio\index.html` 拖入 Chrome／Edge。相鄰的 assets、vendor、learning-relations 目錄必須保留；不需要網路字型、安裝套件或連接正式服務。

若本機預覽服務已停止，在專案根目錄執行 `python -m http.server 8776 --bind 127.0.0.1`，再開啟上面的網址。手機實機另需可達的測試服務，不能直接使用電腦的 127.0.0.1。

操作：點四領域卡／左右箭頭，或水平拖曳場景 →「看看四年怎麼學」→ 點一門課 → 展開共同的學習方向 → 點相關課 → 返回或關閉。手機仍是原生上下捲動，不鎖捲軸、不強迫看動畫、不需要收藏。

直接進入數位人文：

- [四年安排](index.html?area=digital&state=overview)
- [數位策展詳情](index.html?area=digital&state=detail&course=course-049)
- [數位策展的學習關聯](index.html?area=digital&state=relations&course=course-049)
- [敘事領域跨域關聯案例](index.html?area=narrative&state=relations&course=course-046)

## 這次改了什麼

以數位人文完整流程為主，同一套構圖也支援四領域的全部 69 門課，並非只有展示用的幾門課。

- 手機先見大場景，再見四領域選擇；390×844 的場景約從 198px 開始，四個選項仍在首屏完整可見。主操作允許自然往下閱讀，不強求所有資訊擠在一屏。
- 手機維持 2×2 領域全覽；桌機左側領域、右側聚焦場景。放大縮圖、依原有名稱分段換行，不把名稱裁掉或縮成代號。
- 同一張圖延續至領域橫幅和詳情標頭；不重複堆大封面。原圖、原有衍生素材都沒有覆寫。
- 課名與一句學習內容優先，學期、必選修、學分仍明列。四年連續可讀，年級可直接跳轉，沒有藏課的分頁或折疊。
- 學習關聯取代面板中的介紹區，不再追加一份長清單。先見共同方向與四年分布，再看各課的連結理由；目前課程、跨域來源與返回位置都有標記。
- 動效只用於領域切換、按壓、詳情與關聯出現；約 140–220ms，無永動／逐列瀑布。減少動態設定會停用轉場。
- 保留原生 dialog、背景隔離、Tab／Shift+Tab 循環、Escape、瀏覽器上一頁與下一頁、相關課返回，以及兩層閱讀位置和焦點還原。
- 年級跳轉以 replaceState 保留定位，不額外干擾面板歷史深度；歷史狀態包含原課與捲動位置，跨文件歷史恢復時可還原。
- 圖片載入失敗仍能辨認領域、閱讀課程和完成操作；不依賴插畫上的文字或熱區猜課程。

## 使用技能與取捨

使用 design-taste-frontend-v1、schoger-ui-design、ui-design-brain，並完整閱讀 UI Brain 的 components 參考。不使用 oil-ui 或 oil-ui-pro。

Taste 影響的是左右構圖、场景接續與目的明確的互動；Schoger 影響字階、內外間距、主次操作與邊緣；UI Brain 影響卡片、導覽和面板的辨識與鍵盤操作。技能的高動態、SaaS 模板、西文字型和 36–38px 按鈕預設，均讓位給既有樣張技術、繁體中文、44px 觸控範圍及穩定閱讀。

配色先保留共同基準：閱讀底 `#FAF9F3`、表面 `#FFFEF9`、墨色 `#213047`、次級文字 `#4B5B6A`、主要行動 `#265CD7`。一般導覽以墨色呈現，藍色用於主要行動、焦點和目前位置，沒有新增四套領域按鈕色系。新增的淡暖底 `#EFEADC` 只協助分組，不作為資訊的唯一標記。

## 資料與修改邊界

直接共用 [learning-data.js](../learning-relations/learning-data.js) 的課程事實、介紹與 13 組學習關聯，並沿用 [storyboard.js](../learning-relations/storyboard.js) 的資料查詢與關聯導航核心；新入口、版面和歷史接續在 studio.js 中獨立處理。

| 領域               | 大一 | 大二 | 大三 | 大四 | 合計 |
| ------------------ | ---: | ---: | ---: | ---: | ---: |
| 人文思維與方法     |    6 |    4 |    1 |    2 |   13 |
| 敘事與內容創作     |    2 |   10 |   11 |    3 |   26 |
| 數位人文           |    3 |    3 |    4 |    2 |   12 |
| 文化創意與社會設計 |    1 |    6 |    7 |    4 |   18 |

課程名稱、年級、學期、必選修、學分和原始 module 均不改；入口「敘事與內容創作」沿用已確認的展示名稱，來源 module「文學創作」保留。介紹與能力沿用前一輪編輯內容，不是新增的課綱、實際成果或經驗證就業保證；學習關聯不是先修規定。人文與文化素材配對仍可討論。

正式 src、套件設定、收藏、原 B 入口、原關聯小樣和根目錄 DESIGN.md 均未修改；沒有新增依賴、生成圖片、推送或部署。

課程來源 SHA256：`9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691`。

## 重跑檢查

在專案根目錄執行：

```powershell
node doc/design/four-worlds-20261010/learning-relations/verify.mjs
python -X utf8 doc/design/four-worlds-20261010/creative-studio/verify-browser.py
node node_modules/eslint/bin/eslint.js doc/design/four-worlds-20261010/creative-studio/studio.js
node node_modules/prettier/bin/prettier.cjs --check doc/design/four-worlds-20261010/creative-studio/index.html doc/design/four-worlds-20261010/creative-studio/studio.css doc/design/four-worlds-20261010/creative-studio/studio.js
```

瀏覽器檢查使用環境既有的 Python Playwright／Chromium，並確認 8776 的本機服務。`--focused` 只跑操作回歸，不含全部 69 門課逐門循環與四尺寸壓力檢查；其結果另存 focused-results.json，不冒充完整結果。

圖證與逐項結果在 [evidence](evidence/)；完整结果以 [results.json](evidence/results.json) 為準。含課程事實、全部課程開啟／關聯／返回、320／390／768／1280px 四尺寸、長名稱、觸控模擬、鍵盤、瀏覽器歷史、焦點與捲動、圖片失敗、減少動態和 200% 文字尺寸壓力檢查。

已人工查看入口、詳情、目前課程關聯、跨域和窄螢幕圖證。這不是學生理解測試、真實手機驗收、讀屏認證或動效效能測量。200% 是將文字的實際 computed font-size 加倍，不是改 DPR，也不是瀏覽器工具列縮放；仍需真機檢查 Safari 的返回和觸控，以及確認是否更願意探索、看懂課程安排。

下一步先比較這份樣張的入口與完整操作感受，再決定是否調整圖文比例／行動色或移植正式網站；不以測試通過代表審美已定稿。
