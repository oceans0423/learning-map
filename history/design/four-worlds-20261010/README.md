# 四領域課程地圖｜版面樣張交接

日期：2026-10-10。階段：P1 內容簡報完成；P2 已選定 B 版，四領域母圖已保存、接入並完成畫面自檢，待使用者確認完整系列效果。現有網站保持原版，未部署或推送。

## 已確認的版型

使用者於「01｜手機版型比較」選擇 **02 B｜四領域全覽＋大幅聚焦場景**，對應候選 ID `overview-focus` 與 [B 版樣張](atlas-b.html)。後續以 B 為主，不再重開 A／B 選擇；A 與比較頁保留為探索紀錄。

設計落實為：四大領域初始全部可見，點選切換聚焦；左右滑動只作用於大場景區，按「探索」進入連續的四年課程安排。插畫優先服務 B 的大場景與領域內頁，兼顧全覽縮圖的辨識。

圖像方向已依使用者的新參考調整為「手繪觀察場景：細墨線、局部淡水彩、有空間與故事、沒有圖內文字」。母圖不再以白底置中物件或微縮模型為目標；全覽縮圖使用場景局部裁切。四領域母圖均已接入樣張。

使用者已確認手繪窗邊工作空間圖作為數位人文母圖：紙本地圖與照片連到牆面材料及螢幕分析，以此固定系列畫風。原圖完整保存在 `public/images/worlds/originals/`，另製作三個 WebP 版本並複製到任務資產目錄；素材來源、雜湊與用途見 [素材紀錄](../../../public/images/worlds/README.md)。

本輪新增「陽光下的巷角寫生時光」暫配人文思維與方法、「陽光下的歐式庭院藝術展佈置」暫配文化創意與社會設計。使用者尚未明確指定兩張圖的領域，因此此配對可調整；不把同一張圖重用為敘事領域。再次提供的研究工作桌與既存原圖雜湊一致，不重複匯入。

使用者隨後提供「窗邊的靜謐創作角落」補齊敘事與內容創作。以窗外觀察、桌上創作本與牆上作品建立內容創作的關係；四張不同的原圖各有完整、聚焦與縮圖，敘事不再顯示缺圖占位。

## 先開這兩個檔案

- [A／B 互動比較頁](style-explorer.html)：直接用瀏覽器開啟，不需要啟動開發伺服器。
- [數位人文生圖提示詞](ART_PROMPT.md)：使用者在平台生成後提供原圖。

比較頁先切到「手機」，再進入單張查看，以「實際尺寸 100%」判斷文字與操作；並排縮圖只用來比較構圖。也可直接開 [A 版](atlas-a.html) 或 [B 版](atlas-b.html)。

## 兩版差別

| 版型                    | 入口方式                                   | 適合觀察的重點                           |
| ----------------------- | ------------------------------------------ | ---------------------------------------- |
| A｜四域共景＋線性聚焦帶 | 四區共享畫布；點選領域，下方預覽可左右滑動 | 四個場景能否一眼辨認，又保有整體探索感   |
| B｜全覽＋大幅聚焦場景   | 保留四領域導覽；大圖區可左右滑動           | 圖像放大後，內容與探索按鈕是否仍容易找到 |

兩版使用同一份課程、文案、色票與母圖位置。比較階段已結束，使用者已選 B；素材到位後檢查 B 的圖像辨識與閱讀，A 只留作參照。

## 可以試的操作

1. 點選四領域，確認目標、課程數與選中狀態同步；滑動只在提示的線性區域進行，也可用上一／下一領域按鈕。
2. 按「探索」進入領域，往下閱讀完整四年安排，點年級跳至該段，再查看課程詳情與返回。
3. 到「全部課程」，搜尋課名、依年級／必選修篩選，試試找不到課程的狀態。
4. 可選擇收藏，再從「我的課程」查看或移除；不收藏也能完成全部主線操作。

此版收藏只保留在當次開啟的記憶體中，重新載入即清空，不讀寫現有網站的收藏或星座作品。角色揭曉與永久儲存不在這輪樣張範圍。

## 內容與視覺範圍

- 使用現有 69 門真實課程：人文 13、敘事 26、數位 12、文化 18；課名、年級、學期、必選修與學分沿用來源。
- 數位人文四年各 3／3／4／2 門；五門代表課程已有具體介紹與兩個能力重點，其餘課程保留基本資訊，逐課介紹後續補齊。
- 暖白 `#FAF9F3` 閱讀底、深藍 `#213047` 文字、藍色 `#265CD7` 主操作；領域識別採紫／橘／天藍／青綠。
- 四領域使用使用者提供的專屬手繪母圖。未沿用先前不喜歡的抽象雕塑或星座圖卡，也未自行生成圖片。
- 減法：入口不加重複口號；課程列保留完整課名與必選修，學分和能力說明放入詳情；四年不收合切碎，僅查找結果分頁。

## 動效與檢查紀錄

三個基本動作是：按壓與收藏計數回饋、領域預覽的方向性交接、首次進入的一次局部出場。閱讀頁不加入持續旋轉、視差或強制滾動敘事。

- 類型檢查與本次腳本 ESLint 通過；未跑生產建置或全量測試。
- [資料與狀態驗證](verification.json)：第 1、2、3 次，A／B 均 PASS。涵蓋 69 門事實、領域與年級數量、搜尋／分頁／空結果、收藏記憶體狀態、切換邊界及減少動效的狀態分支。
- 瀏覽器已取得 390×844、1280×900 的入口／領域／詳情／查找畫面，另檢查 320×740 窄屏、完整數位領域長頁與滑動切換。最新報告沒有控制台錯誤、橫向溢出或圖片載入錯誤。
- 已查看首次出場、領域切換與收藏的開始／中間／結束三幀；錄屏亦已留存。未測量幀率，未在真實手機操作，未做高中生試用或獨立視覺評審，不提供審美分數。
- CSS 與狀態分支已支援 reduced-motion；尚未在作業系統設定下實測。`@2x` 長頁截圖是高像素密度輸出，不代表已測 200% 瀏覽器或文字縮放。

證據位置：

- [A 畫面報告](evidence/a-layout/report.json)、[B 畫面報告](evidence/b-layout/report.json)、[窄屏報告](evidence/narrow/report.json)、[長頁報告](evidence/full-domain/report.json)、[滑動報告](evidence/gesture/report.json)。
- [首次出場錄屏](evidence/entry-motion/record.mp4)、[選領域／進入／返回錄屏](evidence/selection-motion/record.mp4)、[詳情／收藏／查看錄屏](evidence/collection-motion/record.mp4)；各資料夾另有 `motion-start/mid/end.jpg`。

母圖接入後的本輪檢查：

- [B 圖像入口](evidence/b-artwork-home/report.json)、[領域與詳情](evidence/b-artwork-domain/report.json)、[320 px 窄屏](evidence/b-artwork-narrow/report.json) 均無控制台錯誤、橫向溢出或圖片載入失敗；已查看實際手機／桌機畫面。
- [圖像滑動回歸](evidence/b-artwork-gesture/page.png) 確認從數位人文向右拖曳可切回敘事；修正了新增圖片的瀏覽器原生拖圖與領域手勢競爭，裝飾圖不接收指標事件。
- [接圖後操作錄屏](evidence/b-artwork-motion/record.mp4) 為 3.2 秒，包含選領域、探索、返回與反向滑動，已查看三幀；原有三個基本動作不另加循環物件動畫。
- 圖像路徑加入資料驗證；A／B 第 1／2／3 次均 PASS。B 的圖像已自檢，沒有獨立審美評分，實機、200% 文字縮放與學生試用仍未完成。
- 四邊短距離漸隱接到暖白底；圖片與文字分開，不疊放標題、額外標籤或裝飾框。此為第一張母圖接入時的紀錄；最新素材狀態見下節。

## 三張場景接入的本輪紀錄

- [人文入口](evidence/b-thinking-home/report.json)、[文化入口](evidence/b-culture-home/report.json) 與各自 [人文內頁](evidence/b-thinking-domain/report.json)、[文化內頁](evidence/b-culture-domain/report.json) 均檢查 390×844／1280×900；已查看實際畫面，圖文不重疊，完整場景延續到領域內頁。
- [320 px 窄屏](evidence/b-three-scenes-narrow/report.json) 與 [反向拖曳](evidence/b-three-scenes-gesture/home.png) 無控制台錯誤、橫向溢出或圖片載入失敗。拖曳從文化切回數位，未被圖片原生拖曳攔截。
- [操作錄屏與三幀](evidence/b-three-scenes-motion/record.mp4) 保留點選、雙向拖曳、探索、返回與切回人文的流程；原有首次局部出場、領域方向性交接、按壓／收藏回饋三個基本動作不改，不新增循環或滾動特效。
- 驗證擴充到三領域的完整／聚焦／縮圖路徑、公開素材與樣張副本一致、原圖雜湊與敘事缺圖狀態；A／B 第 1／2／3 次均 PASS，類型與本次腳本 lint 通過。
- 依 oil-ui 做局部畫面自檢，未做獨立審美評分或真實手機驗證。本輪不增刪介面文字，保留領域名稱、選中狀態、課程數與探索按鈕；未處理正式網站載入效能或 200% 文字縮放。

## 素材重製與後續

本次敘事補圖檢查：

- [敘事入口](evidence/b-narrative-home/report.json) 與 [領域內頁](evidence/b-narrative-domain/report.json) 均檢查 390×844／1280×900；另檢查 [320 px 窄屏](evidence/b-four-scenes-narrow/report.json) 與 [26 門課完整長頁](evidence/b-narrative-full/report.json)。已查看實際圖像，無控制台錯誤、橫向溢出或圖片載入失敗。
- [雙向切換／探索／返回錄屏](evidence/b-four-scenes-motion/record.mp4) 及同資料夾三幀留存，確認數位與敘事可雙向切換。原有三個基本動效不改，不增加循環特效，不增刪介面文字。
- 素材驗證改為四領域路徑與副本一致，新增四張原圖雜湊互異的檢查；第 1／2／3 次 A、B 皆 PASS，類型檢查與腳本 lint 通過。依 oil-ui 自檢局部畫面，未另做獨立審美評分、真實手機或 200% 文字縮放驗證。

任務資產使用 `assets/{thinking,narrative,digital,culture}-mother.webp`（完整場景）、`*-focus.webp`（聚焦裁切）、`*-thumbnail.webp`（全覽局部）；產生器也保留 PNG 相容。完整原圖不內嵌到比較頁，數位人文仍用原 `artwork.json`，新圖有各自紀錄。

在 `E:\DEV\leearning-map` 執行：

```powershell
python -X utf8 doc/design/four-worlds-20261010/prepare-artwork.py public/images/worlds/originals/digital-humanities-original.png
python -X utf8 doc/design/four-worlds-20261010/prepare-artwork.py public/images/worlds/originals/humanities-thinking-original.png --area thinking
python -X utf8 doc/design/four-worlds-20261010/prepare-artwork.py public/images/worlds/originals/narrative-content-original.png --area narrative
python -X utf8 doc/design/four-worlds-20261010/prepare-artwork.py public/images/worlds/originals/cultural-social-design-original.png --area culture
node doc/design/four-worlds-20261010/build-prototypes.mjs
python -X utf8 .codex/skills/skills/oil-oil-oil-20261009084229763/scripts/build_explorer.py doc/design/four-worlds-20261010/manifest.json --output doc/design/four-worlds-20261010/style-explorer.html --force
node doc/design/four-worlds-20261010/verify-prototypes.mjs
```

現在可直接查看 B：四領域均有插畫，以瀏覽器開啟 `atlas-b.html?area=narrative` 可直接查看本次敘事補圖。下一步確認完整系列與頁面效果；正式網站改版另依後續開發任務進行。

相關規劃：[主提案](../../UI_UX_PROPOSAL_2026-10-10_FOUR_WORLDS.md)。

## 課程關聯延展小樣

[四幕學習關聯](learning-relations/storyboard.html) 已從數位人文延展到全部四領域與 69 門，補齊一句介紹、能力重點及 13 組學習關聯。含跨域課程詳情與返回原閱讀位置；[逐課內容](learning-relations/CONTENT.md) 與 [交接／驗證](learning-relations/README.md) 可獨立查看。這是領域內閱讀的設計小樣，尚未接回此處原 B 的探索入口；原 B 與正式網站不變。
