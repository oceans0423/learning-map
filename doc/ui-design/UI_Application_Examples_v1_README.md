# UI核心術語應用範例 v1

本版選取80個核心術語，每詞一個文字應用範例，另有8組完整介面組合。與626詞主表v2並存，使用原term_id串接，不修改主表或增加新術語。選取依一般Web與手機介面、教學平台、課程探索、書信閱讀及AI協作產品的應用價值，並非按流行度或主表entry_level自動篩選。

## 檔案與關係

- UI_Core_Application_Examples_v1.csv：80列，27欄。example_id為主鍵；term_id為對主表的外鍵。未來可一詞多例。
- UI_Interface_Recipes_v1.csv：8列，14欄。recipe_id為主鍵；term_ids引用主表，可包含未選入80詞的搭配術語。
- 兩份CSV均為UTF-8 BOM、CRLF換行、完整CSV引號轉義，可由Excel或程式讀取。

## 使用方式

先從術語主表找名稱與定義，再依term_id選範例，檢查use_when與avoid_when。依產品調整parameters_json後，使用agent_instruction建立介面；最後依acceptance_checks驗收。需要整頁流程時使用組合表。

數值、顏色、斷點、字級、時間與彈簧參數都是示範起點，不是跨平台標準。參數名稱為本資料集編輯鍵；清單值目前用逗號分隔字串，若後續轉成JSON Schema可再正規化為陣列。key以_px或_ms標明像素或毫秒，其餘值按鍵名與指令解讀。彈簧參數需先指定引擎，不能跨引擎直接套用。

觸控區44px是示範值，不能當作WCAG 2.2所有等級的最低尺寸。對比需按文字大小、元件用途、背景合成與適用規則實測，本版未計算所有示範配色的對比。可見字元計數與原生HTML maxlength的UTF-16碼元計數不同；採可見字元規則時需另實作並確保前後端一致。

## 範例欄位

|欄位|說明|
|---|---|
|example_id|範例主鍵，未來同一術語可增加多個範例。|
|term_id|對應626詞主表的term_id。|
|term_en|主表英文術語名稱。|
|term_zh_tw|主表繁體中文名稱。|
|category_id|主表分類ID。|
|category|主表分類名稱。|
|scenario|本範例的介面與任務。|
|recognition_cues|如何從外觀或行為辨識術語。|
|use_when|合適使用條件。|
|avoid_when|容易誤用或需要避免的情境。|
|parameters_json|有效JSON物件；參數名稱為編輯欄位，不保證可直接作為任何框架API。|
|parameter_basis|illustrative_starting_point：示範起點。|
|agent_instruction|可交給AI Agent的具體指令。|
|acceptance_checks|完成後應檢查的結果；本版未實作產品測試。|
|combine_term_ids|搭配術語的ID，以分號分隔；可連到主表中未選入80詞的術語。|
|combine_term_names|與搭配ID順序一致的英文名稱，便於閱讀。|
|platform|本版聚焦Web與Mobile Web；不聲稱完成原生App適配。|
|example_type|text_application：文字應用範例，未含截圖或互動原型。|
|example_review_status|editorial_not_product_tested：已做編輯與資料結構檢查，尚未在產品實作驗收。|
|concept_source_url|從主表繼承的概念參考來源；主表尚無來源的風格詞保留空值。|
|master_source_status|完整保留主表來源狀態，不因新編範例升級。|
|supplement_source_url|本次額外查閱的官方參考；沒有新增查閱時留空。|
|supplement_source_status|checked_behavior／checked_concept／checked_reference／not_rechecked，詳見來源說明。|
|source_evidence_scope|本次官方資料核對範圍，避免把概念查證誤當所有參數與範例已驗證。|
|master_dataset_version|串接的主表版本2.0。|
|example_dataset_version|範例表版本1.0。|
|updated_date|本版更新日期。|

## 組合欄位

|欄位|說明|
|---|---|
|recipe_id|組合主鍵。|
|recipe_title|介面組合名稱。|
|goal|使用者任務目標。|
|term_ids|參與組合的主表術語ID，分號分隔。|
|term_names|與ID順序相同的英文名稱。|
|layout_spec|布局與內容安排。|
|interaction_flow|正常、異常與返回的操作流程。|
|constraints|主要限制與設計要求。|
|agent_instruction|一段完整的Agent實作指令。|
|acceptance_checks|完成後的驗收檢查。|
|review_status|編輯完成，尚未做產品實作測試。|
|master_dataset_version|主表版本2.0。|
|recipe_dataset_version|組合表版本1.0。|
|updated_date|更新日期。|

## 來源與驗證範圍

主表來源狀態原樣保留。pending_term_verification不因新增範例改為正式規範。Glassmorphism、Neobrutalism與Editorial Style等風格範例屬編輯應用描述。

本次另查閱7個術語的官方資料：

- checked_behavior：核對特定操作行為；用於Modal Dialog、Focus Restoration與Tabs。
- checked_concept：核對概念；用於Reduced Motion與Card Grid。
- checked_reference：查閱相關規則作為檢查依據；用於Touch Target與Color Contrast，不表示本表所有示範值都達標。
- not_rechecked：本次未逐詞重新核對，只保留主表的概念來源。

所有新增場景、指令、參數及組合均為本版編輯內容，不是官方文件原句。已檢查CSV結構、JSON解析、外鍵及名稱對應；尚未製作或測試80個實際介面，未附圖片與互動原型。

官方參考（查閱日期2026-10-10）：

- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout

## 核心術語分布

|主表分類|本版詞數|
|---|---:|
|視覺風格與設計流派|4|
|布局與構圖|5|
|頁面與介面模式|1|
|網格、尺寸與間距|4|
|色彩與配色|4|
|字體與文字編排|2|
|UI元件|15|
|狀態與回饋|10|
|動效與轉場|11|
|響應式與適應性設計|3|
|無障礙與易用性|7|
|設計系統與元件規格|3|
|表單與資料輸入模式|2|
|捲動與內容瀏覽行為|1|
|資料視覺化介面|1|
|介面文字與內容設計|1|
|AI產品介面模式|5|
|表面、材質與視覺效果|1|

## 串接範例

```python
import pandas as pd
master = pd.read_csv('UI_Terminology_Dataset_v2.csv', encoding='utf-8-sig')
examples = pd.read_csv('UI_Core_Application_Examples_v1.csv', encoding='utf-8-sig')
joined = examples.merge(master[['term_id', 'definition']], on='term_id', how='left', validate='many_to_one')
```
