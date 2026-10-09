# 十二星座課程探索交接｜2026-10-09

## 現行版本提醒

本文件下方為Z-01～Z-04的歷史交接。後續已完成十二款介紹與四年完整課程範圍，取消固定六門，新增年級切換；現行交接請先讀[星座說明與四年課程](HANDOFF_2026-10-09_ZODIAC_STORIES.md)、[最新進度](ZODIAC_STORY_TASK_PROGRESS.md)、[v2分類](ZODIAC_COURSE_MAPPING_v2.md)。主題資料版本2不改個人v1存檔。下方六課敘述、驗證數與PID保留為歷史，不是目前限制或預覽程序。

工作目錄：`E:\DEV\leearning-map`。環境預設的`E:\開發\leearning-map`是舊副本，不可混用。

## 功能範圍

使用者已授權從固定天蠍座擴充為十二星座與依自選課程配對。工程功能完成，主題分類保持「設計草案，尚未經學系審核」。學生直覺性與真實裝置驗收另待進行。

- 主地圖仍是四領域／四年級／全69課搜尋、原詳情、6／12門分頁。星座不取代主站，也不要求收藏。
- 我的課程預設清單；有收藏才出現「找到我的星座」。依同一份收藏配對並生成對應點線星圖，不用自己畫、不重選課程、不解鎖。
- 配對顯示真實課程主題證據；可自行選十二款造型，明示原配對與手動造型的差別，不改收藏。
- 「探索十二星座」零收藏也可用。每種主題六門跨年級探索起點；點開共用詳情後逐門自願加入，不是修課順序／本學期選課單，不自動替換收藏。
- 所有合法ID保留，超過星點數時共用星點展開小清單；完整課程仍有分頁。單課星點直開詳情，小清單不是第二個modal。
- 星座只是文化意象與探索圖像，不看生日，不提供人格、能力或科學適性判定。未新增隨機、個人命名擴充、下載／分享、多作品或分析追蹤。

## 本機開啟

<http://127.0.0.1:5186/>，目前為正式dist的隱藏Vite預覽程序；最新啟動PID25528，不保證重開機後仍在線。不停止不明的5181／5182服務。

1. 自己選課：從課程詳情加入 → 我的課程 → 找到我的星座 → 可換造型／看看該星座主題課程。
2. 先探索組合：我的課程 → 探索十二星座 → 換星座主題 → 看詳情後自行加入。

可直達主題：<http://127.0.0.1:5186/?mapScreen=zodiac&mapZodiac=taurus>。這個連結只選主題，不帶個人收藏、不寫存檔。

若頁面仍是舊版，先視需要自行保存未儲存收藏，再重新整理；不替使用者強制保存。重啟：

```powershell
Set-Location -LiteralPath 'E:\DEV\leearning-map'
npm run build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5186 --strictPort
```

5186已在使用就不用另開。更新build曾需停止自己已確認的預覽程序以解除Windows輸出鎖；不要停止不明服務或強制清除`dist-atlas-v2`鎖住的舊臨時輸出。正式入口只用dist。

## 資料與配對

[完整12主題與69課逐門分類表](ZODIAC_COURSE_MAPPING_v1.md)。新增資料獨立於核定courses.json；原課名、年級、學期、學分、必選修、module、面向均不改。前台「敘事與內容創作」仍只是正式「文學創作」的名稱映射。

- 十二個主題、十二款不同且連通的藝術化點線，非精確天文星位。每種六門已存在、與主題有連結的探索起點。
- 全69課均有2–3個探索標籤與人工解讀理由；包括24門primaryTrack=null課程。null不是未分類，不擅自改正式面向。
- 每門貢獻均分到標籤。共同必修基礎（required＋foundation＋primaryTrack=null）權重0.5，其餘1；避免共同必修壓過自選興趣。
- 去重／忽略未知ID／穩定排序，再比較主題分布與星座權重的cosine similarity；不展示假精確的適性百分比。
- 差距<1e-9列為同分，固定登錄順序作預設；顯示並列並允許換造型。少於3門明示初步結果；9個以上主題有貢獻時提醒跨主題。零門不給配對。
- 少量課程先填入較分散的點，超量共用星點，空點是造型而不是待解鎖課程。天蠍保留原11點與填入順序。
- 待學系逐門審閱分類；目前禁止把draft擅自改成approved，也不使用待審課程摘要、活動或成果推論。

## UI／UX與相容

本次使用UX Architect與UI Designer skills：沿用深藍、柔白、香檳金token，沒有新主模式或重型動效。容器寬足夠時說明與星圖並排，手機／放大／詳情縮窄回單欄。配對結果先聚焦，依據可展開；草案提示常駐。原生select與44px星點，不依賴hover／拖曳；reduced-motion取消動效。

雙魚座曾在320px＋200%文字出現點按範圍過近，已微調座標並補206×500／260×360最小圖框幾何回歸。星點ID包含星座名稱：移除課程導致自動配對換型時，關閉詳情回安全標題，不錯認新造型同編號星點。最近移除復原仍可重新配對。

- 沿用唯一personal reducer與`humanities-atlas:personal:v1`。不改同意、舊名稱、代表星、初始化狀態或存檔格式。主動移除／復原仍遵守原代表星同步契約。
- 新增`mapScreen=zodiac`、`mapZodiac`、`mapZodiacAnchor`；`mapZodiac`缺省／null為個人自動配對，主題直連缺省為牡羊。個人清單／星圖共用mineAnchor，主題另有anchor。
- 手動造型只在URL／當次畫面保存，不新增localStorage key。分享造型URL不傳送個人收藏。
- 主題返回恢復來源route／scroll／focus；全站搜尋後清除恢復原主題／造型。從主題點標頭「我的課程」回清單，不偷偷把瀏覽主題當個人造型。
- 舊比較原型`#scorpius`與`?ui=legacy`保留；已有代表星仍能看原作品。不新增另一套全課程勾選器。

## 程式分工

| 路徑 | 責任 |
| --- | --- |
| src/config/zodiac.ts | 十二ID、十二探索標籤、資料型別 |
| src/data/zodiacProfiles.json | 主題意象／權重／六課／點線／填入順序草案 |
| src/data/zodiacCourseThemes.json | 全69課標籤與理由草案 |
| src/data/zodiac.ts | 載入驗證、覆蓋／唯一／合法／連通契約 |
| src/lib/zodiac.ts | 純配對、證據、同分與泛用課程填點 |
| src/components/CourseZodiacControls.tsx | 配對說明／手動造型／主題切換／小型十二款圖鑑 |
| src/components/CourseAtlasConstellation.tsx | 同一份ID的泛用十二造型、原生星點、分組 |
| src/components/CourseAtlasApp.tsx | 兩條路徑、唯一收藏、共用詳情、返回來源 |
| src/lib/courseAtlasRoute.ts | 新參數與深連結、安全值、history相容 |
| src/styles/course-atlas.css | 既有局部token、容器並排／單欄、原生操作樣式 |

原`src/lib/scorpius.ts`保留給獨立原型；沒有改寫舊作品生成器。

## 工程驗證

- 132項單元測試／21檔；其中本次新增28項，包含資料錯誤拒絕、全課覆蓋、去重／順序穩定／輸入不變、權重正規化、同分／少量／廣泛興趣、十二款×六種課量、最小圖框與新URL往返。
- typecheck、lint、format:check、一般npm run build通過；tracked diff --check通過。
- 新十二星座349組瀏覽器狀態通過、零runtime error，包括五尺寸×12型×1／2／6／12／69門、零收藏主題預覽、完整ID／不寫入、真實內容依據、同分／初步、gallery／逐門加入、touch／reduced-motion、全站搜尋、Back／焦點、直連、移除後換型／復原，以及12型桌機詳情縮窄。349是參數化狀態數，不宣稱349個真人研究。
- 主地圖23組、原個人流程40組、獨立天蠍27組回歸；個人回歸刻意指定天蠍以保留原11點／分組基準，十二款通用能力另由新腳本檢驗。
- 真實Chrome200%zoom：1414→707 CSS px、DPR1→2、CSS字級仍16px；十二款點按不重疊，非CSS zoom或device scale假冒。另測320px、400px低高度、200%文字。
- 新配對／主題／圖鑑／詳情在390與1440的八個axe狀態無報告違規；主線與既有個人掃描也通過。這不等於完整WCAG認證。
- 桌機／手機實際截圖已目視檢查；原PNG與WebP素材不改，不新增圖片生成或依賴。

證據：[十二星座結果](validation/course-atlas-zodiac-20261009/results.json)、[原個人流程](validation/course-atlas-constellation-20261009/results.json)、[主地圖](validation/course-atlas-v2-20261009/results.json)、[真實瀏覽器縮放](validation/course-atlas-v2-20261009/browser-zoom.json)、[原型回歸](validation/scorpius-20261009/results.json)。截圖位於各證據資料夾。

執行新測試（本機既有快取；搬移後需提供對應路徑，未新增套件）：

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
node doc/validation/course-atlas-zodiac.mjs C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright http://127.0.0.1:5186/ C:/Users/user/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js
node doc/validation/course-atlas-zoom.mjs C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright http://127.0.0.1:5186/
```

未驗證：真實手機、Safari／Firefox、實際軟鍵盤／IME、真人讀屏與學生直覺性。自動觸控是Chrome注入模擬，所有檢查使用隔離context／臨時profile，不讀寫使用者真實瀏覽器資料。

## 未變動與下一步

原課程SHA256：`9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691`。
原背景PNG SHA256：`AEB9020CDF7D7EDED29FF37B9ECB69CDECC96AD03D05E95A38ADDB54841F4404`。

沒有部署、commit、推送、新追蹤、存檔遷移、刪除舊作品或真實瀏覽器資料。原dirty／untracked修改保留。安全下一步是請學系審閱分類表，並用真實手機請學生試走「自己選課配對」與「先看星座組合」兩條路徑；下載／分享或命名擴充需另確認範圍。
