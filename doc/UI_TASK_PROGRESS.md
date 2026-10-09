# UI 逐項開發進度｜2026-10-09

最新使用者指示：上班期間持續一個任務接一個完成。每項驗證後才前進，不部署、不公開、不改核定課程資料；學生／未提供瀏覽器的實測與內容核定另列待確認。

## UI-01｜完成

正式 CodeGraph 已初始化，資料、詳情、App 狀態與 URL／歷史主要符號已確認。初輪 38 項單元測試與 14 組 Chrome 桌機／手機模擬基線及 10 張截圖保留於 [基線紀錄](UI_TASK_EVIDENCE.md)。

## UI-02｜完成

- 新增 src/data/explorationSignals.json、explorationSignals.ts、explorationSignals.test.ts 及 src/config/explorationSignals.ts。
- 69 門完整、65 門指派訊號＋4 門 open 匯流，20／14／10／21 主訊號、50 次訊號；全部 draft。
- 遺漏／未知／重複 ID、非法訊號／政策、整合政策及 OR 去重均有自動測試。
- 全部 46 項測試、typecheck、lint 通過；原 courses.json SHA-256 仍為 9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691。
- 尚未更換畫面、不重新核定資料，無需把新導覽草案冒稱已核准。

## UI-03｜完成

新增兩種表面、四訊號與深色文字、獨立焦點、字級／間距／動效 token，不加入字體或動效依賴。新增 contrast 純函式與實際 CSS 對比測試，全部 48 項測試、typecheck、lint 通過。

初次控制邊界色對比不足，已調整為 #667f88；Vitest 原先 mock CSS，已限縮開啟 token CSS 處理，測試讀取實際 stylesheet 而非複製色碼。Chrome 154.0.8037.98 在 360／390／768／1024／1440 px，正常與 reduced-motion 共 10 組通過，無水平溢位，16 px 基本文字與系統字體回退正常；減少動效即時切至 0ms。證據：[UI-03 結果](validation/ui03-20261009/results.json)，同目錄五張截圖，390 px 畫面已目視檢查。Safari、Firefox、實機與學生測試未執行。

## UI-04｜完成

建立 Button 原生元件、buttons.css 與開發展示頁 ui-buttons.html。五尺寸 Chrome 實測滑鼠／模擬 tap／Enter／Space、多選／單選語意、清除、focus-visible、禁用、44 px 目標、無巢狀 button、reduced-motion 全部通過；收藏切換固定 160 px。證據：[UI-04 結果](validation/ui04-20261009/results.json)，五張截圖，1440 px 已目視確認。typecheck 通過；展示頁不加入正式 build、不假裝提供保存／下載。

## UI-05｜完成

新增 WorkbenchApp 與 workbench.css；App 接至工作台，舊 App 保留為 LegacyApp 供遷移參照，不覆寫既有資料／URL 函式。入口縮短，四訊號導覽區、星圖／69 門清單入口、桌機兩欄與手機筆記抽屜已接入；正式面向及四年主線收於可展開的補充入口。沒有空收藏匣；桌機摘要插槽不畫容器，手機空插槽隱藏。

五尺寸正常／400 px 低高度＋200% 文字檢查、69 門清單、筆記模式／開關、無水平溢位與 runtime error 通過。首次測試發現舊年級布局最小內容寬度溢位，加入 min-width:0 後重測通過。[UI-05 結果](validation/ui05-20261009/results.json)，10 張截圖，1440 主畫面已目視；48 項測試與 typecheck 通過。地圖本身仍沿用舊年級展開，接續 UI-06 收斂成單學期；新訊號尚未啟用互動，於 UI-08 接入。

## UI-06｜完成

新增 SemesterAtlas、atlas.css、atlas 純函式與四項測試。四年總覽 12／23／23／11，單學期八組 6／6／11／12／11／12／7／4。桌機最多 12 門、手機六門分組，穩定 ID 排序與非重疊網格命中区，不畫先修路線；形狀與文字同時表達作用／必修。每年本工作階段記住學期。

新 URL 增加獨立 atlas 參數；原 sem/focus/open/course 解析與正式面向高亮語意保留。舊多年份網址以第一年進入，全年網址以上學期起始並可切下學期；完整清單仍可到達全部課程。直接課程網址定位年份／學期。返回／前進／關閉保留手機組別，resize 保留 anchor 並 clamp。

52 項測試、typecheck 通過。五尺寸各走完全部 69 ID／八學期，命中区無重疊、舊網址／歷史／記憶、手機 resize、200% 文字通過；[UI-06 結果](validation/ui06-20261009/results.json)，10 張畫面，390 px 學期畫面目視通過。首輪 resize 驗證未等待 matchMedia render，修正測試等實際節點數後全數通過，非產品空白問題。

## UI-07｜完成

新增 modal sibling-branch inert 隔離、原來源／來源消失 fallback 焦點返回；桌機不搶焦點，窄螢幕 initial focus／Tab trap／Esc／body lock。關閉順序先復原 inert 再還原焦點；resize 會更新 modal 行為。筆記新增模組、正式面向、新主次訊號及導覽草案聲明；可見關閉文案。

publishedDetails 投影逐欄核定，新增混合核定／填入草案內容的守門測試，53 項測試、typecheck、lint 通過。Chrome 桌機1440／模擬手機390逐一開啟所有69 ID（138份筆記），姓名／模組／draft整理中／Esc／原來源焦點／inert無殘留／直接網址关闭通過；桌機來源切學期消失後 fallback 通過。[UI-07 結果](validation/ui07-20261009/results.json)，兩張截圖，390 抽屜目視確認。實機／Safari未測。

## UI-08｜完成

四訊號原生 aria-pressed 多選、勾選與獨立輪廓、清除已接入；signals 新 URL 參數與 focus 正式面向分開。主／次訊號 OR 去重、相關以完整學期計算；未命中只降低星點裝飾飽和度，不降低文字對比或隱藏課程；整合匯流不算訊號命中，零相關顯示出口。

Chrome 390／1440 各驗八學期×六組訊號（共96組），數字與實際 mapping 相符，節點全留、手機分組計數不變、清除不重置組別、桌機切訊號不清筆記。[UI-08 結果](validation/ui08-20261009/results.json)，兩張截圖。新增訊號 URL 解析／去重／正式面向隔離測試。另補拍 UI-07 靜止截圖，先前透明殘影是進場動畫中途截取，不是紙面透明；移除原關閉鈕旋轉及放大筆記基本字級。

## UI-09｜完成

新增 CourseSearch／search 純函式与兩項測試；全69課名字面搜尋、trim／NFKC／大小寫處理、零結果出口，不使用使用者正規表示式。中文 composition 中保留輸入但不提交結果，compositionend 後提交（沒有 Enter 自動選課）。清單與星圖共用搜尋，結果可直接跨年份／學期／手機組別定位，清單入口常駐；搜尋不依訊號過濾。

56項測試與typecheck通過。Chrome五尺寸跨年級／不符訊號／最長課名／括號及特殊字串／手機第二組定位／關閉來源焦點／保留關鍵字／零結果轉全部69／模式切換／合成IME事件通過。[UI-09 結果](validation/ui09-20261009/results.json)，五張截圖。實際作業系統中文輸入法及手機軟鍵盤仍待實機確認，合成事件不冒充實機輸入。

## UI-10｜完成（工程已驗；手機流暢度仍需實機）

新增 motion.css 集中220 ms筆記／場景交接；新舊節點不重疊留存、文字／URL立即提交，關閉不等待淡出。reduced-motion即時取消全工作台額外動畫。筆記來源随切課更新；已開啟時交替課程改以replace，不堆歷史，直接網址不發明back marker；關閉保留最新搜尋定位／訊號／學期。

57項測試、typecheck、lint、build、format:check通過。Chrome390／1440正常及reduced各10次切學期、桌機10次交替課程、動畫中關閉、歷史只增加一份、即時偏好切換均通過。實際錄影在validation/ui10-20261009/*.webm，截圖／[效能紀錄](validation/ui10-20261009/results.json)與[關閉錄影複測](validation/ui10-20261009/results-no-recording.json)。Win32／i9-13980HX／32 logical CPU，headless、無CPU節流。兩次手機模擬各1個約83 ms幀，無long task；桌機最大17.4／33.3 ms、無>50 ms幀。此手機長幀列為待實機確認風險，不宣稱整體已流暢。

CodeGraph原索引未自動涵蓋新增檔，已用codegraph sync同步28檔；查詢新符號前需確認索引狀態。錄影元件原缺ffmpeg，僅補測試快取，未加網站依賴；工具自動移除兩份旧Playwright浏览器快取，可重新下載，系統Chrome不受影響，已告知使用者。

## UI-11｜工程關卡通過；學生驗證待測

Chrome開發版與正式build預覽均完成滑鼠、模擬tap、全鍵盤（Tab找目標、Enter與鍵盤文字輸入）、reduced-motion四條找課旅程；各五尺寸400 px低高度＋200%文字／最長課名檢查通過，无空匣／命名要求。正式build僅本機preview，不部署。[開發版結果](validation/ui11-20261009/results.json)／[build結果](validation/ui11-20261009/build-results.json)，各四張截圖。

實際渲染文字對比量測129／152筆，保守以星圖漸層的更亮不透明上界檢查；原筆記三個小標籤只有4.435:1，改用ui-ink-secondary／14px後通過。[對比證據](validation/ui11-20261009/contrast.json)。57測試、typecheck、lint、build、format:check已通過；courses.json雜湊與UI01相同，index.html/favicon原修改保留。非焦點skip-link改用clip隱藏，避免全頁截圖中偏移的固定連結，同時鍵盤路徑重測通過。

工程關卡允许接續UI12。學生無人可測，未聯絡外部學生；Safari／Firefox／手機實機／真實軟鍵盤與IME未測，手機83ms長幀仍列風險。不聲稱「直覺性已驗證」或全瀏覽器相容。

## UI-12｜完成

新增純collectionReducer、三項測試、CollectionPanel與collection.css。工作階段收藏去重，上限69而非8；筆記收藏／已收藏可明確取消，寬度保持；有收藏才出現摘要，末筆取消隱藏摘要但持續的復原提示仍可達。只復原最近移除與原位置。提示區固定、不自動消失、不推動地圖；未收藏初始不出現。手機modal內有自己的狀態宣告，背景inert不造成重複讀屏。

60測試、typecheck、lint通過。Chrome390／1440各收藏全部69、第一筆地圖位置、按鈕宽度、末筆取消／復原、連續移除只復原最後一筆、無storage寫入與未保存重載清空通過。[UI-12 結果](validation/ui12-20261009/results.json)。完整桌機循環揭露跨很長清單往返筆記的捲動成本，改右側sticky且筆記內可捲、關閉標題留住；首／中／末端課程及復原另[補測通過](validation/ui12-20261009/sticky-smoke.json)。收藏仍不是已修課，尚不保存或飛行。

## UI-13｜完成

新增useCollectionFlight，以資料先提交、下一rAF量測來源／目的地，最多一份非互動aria-hidden副本飛行280ms；每幀不量布局。目的地離屏／inert時改局部光暈與既有文字；reduced-motion無飛行。取消、切課／學期／模式、Back、scroll、resize、偏好改變及卸載清理。

Chrome390／1440快速加入→取消→再加入、集合只1、無殘影、clone不可點／讀屏、手機inert降級、正常桌機確實產生飛行、resize／reduce／關閉清理通過。resize測試特意延長飛行至2秒，等待事件處理250ms內消失，不把自然播放完畢當作取消。[UI-13結果](validation/ui13-20261009/results.json)，短錄影與截圖同目錄；60測試、typecheck、lint通過。第69筆資料行為已在UI12驗過，副本始終單一不排隊。

## UI-14｜完成

新增PersonalState/reducer、ConstellationEditor與constellation.css。低強度「我的星座（選用）」及收藏面板明確創作入口，只有主動進入才說明零收藏。首次前八門作可改初值，0不消耗初始化，重新進入保留編輯。代表星是收藏子集，最多8，第9顆明確選替換或取消，不刪原收藏；移除收藏同步移除代表星，最近undo包含身份／順序／座標。undo若新編排已填滿8顆，不偷偷淘汰或產生第9顆，提示先釋放代表星再復原。

64測試、typecheck、lint通過。Chrome390／1440 reduced-mode（此項驗資料／選擇，非動畫）各跑0、1、8、9、69收藏，初始化、編輯保留、替換／取消、收藏不丟、代表星同步移除／復原與69選項全部通過。[UI-14結果](validation/ui14-20261009/results.json)，兩張截圖；純測試額外驗滿8的undo冲突。初始新加星優先使用未佔用的預設位置，避免移除再加後疊到原第8顆。命名接續UI15，不要求集滿8。

## UI-15｜完成

新增constellation純函式／三項測試、ConstellationNaming與ConstellationArt。初始代表身份仍取收藏前8，再按年級／學期／ID構圖；連線無箭頭、兩顆以上才畫，一顆不虛構線。畫布手機短標籤與同面板完整課名／年級圖例對照，明示個人探索想像非先修／能力／推薦。線段以星點中心為錨而非文字區。

24 grapheme純文字名稱，中文／組合emoji不截半，空白回未命名；提交阻擋IME composition，超長提交裁24並可讀說明。首次有效非空名稱才480ms短画線／名稱淡入，改名／返回不重播；reduced即時結果。完成後代表選擇收在可展開「調整代表星」，不顯示未開發保存／下載鈕。

67測試、typecheck、lint通過。Chrome390／1440各1／2／8顆，空白、有效命名、快速改名、尖括號安全、25組家庭emoji裁24、合成IME阻擋、返回保留、無重播、reduced與初始全部節點邊界通過。[UI-15結果](validation/ui15-20261009/results.json)，六張截圖，390八顆構圖目視確認。無人格／能力推論；真實IME仍待實機。

## UI-16｜完成

有界正規化座標、rAF跟手／6px門檻／capture、完整取消，以及可見移動模式／方向按鈕等價操作。滑鼠與Chrome觸控注入、輕點不移位、方向鍵／Enter、Esc／取消／blur／resize／pointercancel／lostcapture復原、邊界與旋轉保留通過。實測揭露觸控隱式capture從內層span移到button時的lostcapture會誤取消，已限定只處理把手自身失去capture並重測通過；不是以模擬pointer事件冒稱實際touch拖曳。

69測試、typecheck、lint通過。[UI-16結果](validation/ui16-20261009/results.json)，390／1440截圖，390已目視；合法範圍內使用者可自由把星點靠近，完整課名圖例仍保留。真實手機跟手、學生、其他瀏覽器仍待測。

## UI-17｜完成

版本化humanities-atlas:personal:v1，只在明確同意後寫入，保存收藏／代表星／座標／名稱與完成狀態；不保存undo或提示、不自動進入編輯器。schema／未知ID／去重／代表子集上限／有限有界座標／24 grapheme守門。壞資料不覆寫；停用把既存同意改false、保留舊快照和當前草稿，獨立確認才刪此key。安全／超額失敗不丟草稿，文字明確說可能仍有舊存檔；找課照常。自動保存以microtask合併同輪改動，cleanup取消過期寫入。

72測試、typecheck、lint通過。Chrome390／1440未同意無寫入、有效保存重載還原而不進編輯、位置自動更新、停用後不寫、刪除取消／確認、quota失敗仍可69找課、未保存重載清空、壞JSON未覆寫通過；額外完全封鎖storage讀取仍69課。[UI-17結果](validation/ui17-20261009/results.json)。測試刪除的只是隔離Chrome context內測試存檔，沒有清除使用者瀏覽器資料。

## UI-18｜完成

獨立SVG含名稱、實際座標／身份、時間順序連線、數字圖例與完整課名／年級、個人探索非先修聲明；長名稱12 grapheme分行、圖例34分行，不依赖外部字體、腳本或圖像。XML轉義並替代非法unicode；固定安全檔名，object URL一秒後或卸載清理。移動預覽未提交時禁用下載，改名須先更新；下載回饋只說交給瀏覽器而非虛構已保存成功。

75測試、typecheck、lint通過。Chrome390／1440×1／2／8顆真下載後用system Chrome file URL開啟，尖括號特殊字元、24中文字／家庭emoji、實際身份與座標一致、文本getBBox未裁切、無外部HTTP請求、storage quota失敗仍可匯出、object URL清理、下載建立失敗文字全部通過。[UI-18結果](validation/ui18-20261009/results.json)，六個SVG／截圖，八顆畫面已目視。獨立SVG整頁截圖曾timeout，改按viewBox尺寸的viewport擷取後通過；不是產品下載問題。

## UI-19｜工程回歸完成；使用者驗證待測

正式build http://127.0.0.1:5182/ 的兩條旅程在mouse／tap／完整Tab鍵盤／reduced-motion全部完成：不收藏找課69門，以及收藏／取消復原／第9顆替換取消／命名／移動取消／同意保存／reload／真SVG下載／返回找課。五寬度360／390／768／1024／1440的400px低高度與200%文字，八星構圖、主要目標44px以上、方向操作及無水平溢位通過；已無殘留inert／飛行副本／runtime error。自動保存失敗、刪除失敗有真實說明，仍能匯出。[UI-19結果](validation/ui19-20261009/results.json)，該目錄含雙旅程錄影、五張200%截圖及真下載SVG。

重跑UI12／14最大69門與0／1／8／9／69選取回歸通過，未同意無storage寫入、原courses.json雜湊與使用者favicon保留。UI17另補同一origin第二頁確認停用後不自動還原；單元補全69保存及每一課名SVG守門，共77測試。typecheck／lint／build／format:check通過。CodeGraph最後同步至83個索引檔，無Pending sync。

兩尺寸編輯器實際文字各67筆、透明gradient最亮合成背景對比通過；必要連線最差3.18:1。[實際對比](validation/ui19-20261009/contrast.json)，390整頁目視後把不含undo的舊收藏浮動提示移至編輯器正常流，避免遮構圖；有undo仍保留入口。select補獨立焦點框。此修正後重建並重跑雙旅程與對比。

效能不誇大：錄影回歸桌機曾66.7ms、touch17.4ms，無longtask；独立無錄影再測曾49.9／66.9ms，最後保留逐幀資料的測量為手機33.4ms、桌機50.1ms，其他多數約16.7ms。[無錄影拖曳樣本](validation/ui19-20261009/drag-benchmark.json)。UI10的手機約83ms交接幀也仍是待實機確認風險；沒有以最好的單次樣本宣稱全程流暢。

依指南保留UI19 [~]，不是再繼續寫功能：工程範圍已交付，但無學生參與、真實手機／Safari／Firefox、實際OS中文IME／手機鍵盤可測，直覺性與實機跟手驗收仍待。新訊號的對外採用仍需內容核定，不因工程完成視為官方分流。未部署、未公开、未commit/push；完整[交接文件](HANDOFF_2026-10-09_UI_IMPLEMENTATION.md)。
