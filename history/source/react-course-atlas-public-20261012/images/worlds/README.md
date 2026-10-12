# 四領域手繪場景素材

日期：2026-10-10。四張圖由使用者在生圖平台製作並提供，均已接入 B 版樣張。研究工作桌沿用已確認的數位人文配置；巷角與庭院的領域配置可調整。創作角落補入敘事與內容創作。未生成或重繪新內容，未接入正式網站。

## 領域配置

| 原始名稱                       | 樣張領域                   | 保存原圖                                                                             | 網頁檔名前綴             |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------ | ------------------------ |
| 陽光下的巷角寫生時光.png       | 人文思維與方法（暫定）     | [humanities-thinking-original.png](originals/humanities-thinking-original.png)       | `humanities-thinking`    |
| 窗邊的靜謐創作角落.png         | 敘事與內容創作             | [narrative-content-original.png](originals/narrative-content-original.png)           | `narrative-content`      |
| 靜謐手繪地圖研究工作桌.png     | 數位人文（已確認）         | [digital-humanities-original.png](originals/digital-humanities-original.png)         | `digital-humanities`     |
| 陽光下的歐式庭院藝術展佈置.png | 文化創意與社會設計（暫定） | [cultural-social-design-original.png](originals/cultural-social-design-original.png) | `cultural-social-design` |

所有下載原檔未移動或改寫。重複提供的研究工作桌與已存原圖 SHA256 相同，沒有重複匯入或重新壓縮。

## 數位人文原圖

- 檔案：[digital-humanities-original.png](originals/digital-humanities-original.png)。
- 原始名稱：`靜謐手繪地圖研究工作桌.png`。
- 尺寸：1448×1086；2,115,136 bytes。
- SHA256：`FB2DE2CBEB35E2087CA45A6E4832286D280F077EF5DB4196AE39B053E26D6716`。
- 完整複製，下載資料夾原檔未移動或改寫。

## 數位人文網頁用版本

| 檔案                                                                   | 用途                       | 尺寸     |          大小 |
| ---------------------------------------------------------------------- | -------------------------- | -------- | ------------: |
| [digital-humanities-scene.webp](digital-humanities-scene.webp)         | 領域內頁的完整空間         | 1280×960 | 179,892 bytes |
| [digital-humanities-focus.webp](digital-humanities-focus.webp)         | B 入口聚焦地圖、照片與螢幕 | 1100×683 | 149,242 bytes |
| [digital-humanities-thumbnail.webp](digital-humanities-thumbnail.webp) | 四領域全覽的辨識局部       | 320×208  |  17,620 bytes |

處理包含 RGB 轉換、局部裁切、Lanczos 縮小與 WebP 品質 88。完整圖未裁掉原場景；聚焦圖和縮圖保留紙本材料與螢幕分析的關係。四角取樣約為 RGB 251／250／245–246，接近樣張暖白底；頁面以四邊短距離漸隱融合，不改原圖色彩。

樣張另有同內容的任務目錄副本，讓比較頁能離線內嵌素材。詳細裁切像素、來源及重製紀錄見 [artwork.json](../../../doc/design/four-worlds-20261010/assets/artwork.json)，重製腳本為 [prepare-artwork.py](../../../doc/design/four-worlds-20261010/prepare-artwork.py)；需要現有 Pillow，不另安裝正式專案套件。

## 本輪兩張新圖

兩張原圖均為 1448×1086。人文原圖 3,192,266 bytes，SHA256 `0CEB59D2F5156383DCECF33BE0D0751D05E03D55CA238FC678E3CF9A3F3F1EE6`；文化原圖 3,239,078 bytes，SHA256 `0FBAC990D218447F4E36ED3AFBED9ED64C4E2CF15590C60AEE56C1A672680A54`。

| 檔案                                                                           | 用途                       | 尺寸     |          大小 |
| ------------------------------------------------------------------------------ | -------------------------- | -------- | ------------: |
| [humanities-thinking-scene.webp](humanities-thinking-scene.webp)               | 領域內頁完整場景           | 1280×960 | 366,860 bytes |
| [humanities-thinking-focus.webp](humanities-thinking-focus.webp)               | 入口的觀察筆記與街巷關係   | 1100×572 | 201,910 bytes |
| [humanities-thinking-thumbnail.webp](humanities-thinking-thumbnail.webp)       | 全覽的筆記辨識局部         | 320×197  |  26,832 bytes |
| [cultural-social-design-scene.webp](cultural-social-design-scene.webp)         | 領域內頁完整場景           | 1280×960 | 397,818 bytes |
| [cultural-social-design-focus.webp](cultural-social-design-focus.webp)         | 入口的展架、畫架與庭院佈展 | 1100×633 | 241,964 bytes |
| [cultural-social-design-thumbnail.webp](cultural-social-design-thumbnail.webp) | 全覽的展架辨識局部         | 320×219  |  31,924 bytes |

沿用 RGB、Lanczos、WebP 品質 88；未調色、重繪或加入文字。新圖筆觸較密，沒有為了統一而加濾鏡；以個別裁切保留活動線索。人文四角約 RGB 252–254／251–253／246–249；文化右上有樹葉，不將該處色彩誤認成紙底。頁面沿用四邊短漸隱、圖文分離與原有配色。

任務副本使用 `thinking-*`／`culture-*` 前綴。獨立紀錄為 [artwork-thinking.json](../../../doc/design/four-worlds-20261010/assets/artwork-thinking.json) 與 [artwork-culture.json](../../../doc/design/four-worlds-20261010/assets/artwork-culture.json)，不覆蓋數位人文紀錄。重製腳本新增 `--area thinking`／`--area culture`；省略仍為 `digital`，遇到不同雜湊的既存原圖會停止，不覆蓋原圖。

## 敘事與內容創作補圖

來源：使用者提供 `窗邊的靜謐創作角落.png`，完整複製為上表原圖，下載原檔未動。1448×1086、2,701,480 bytes，SHA256 `40793EF408B5510B17A189A61BF28F1C69D4D752F35004DE8B58E8E2ABBD5CE7`。

| 檔案                                                                 | 用途                             | 尺寸     |          大小 |
| -------------------------------------------------------------------- | -------------------------------- | -------- | ------------: |
| [narrative-content-scene.webp](narrative-content-scene.webp)         | 領域內頁的窗景、創作本與作品關係 | 1280×960 | 246,110 bytes |
| [narrative-content-focus.webp](narrative-content-focus.webp)         | B 入口聚焦創作本與工作空間       | 1100×464 | 132,464 bytes |
| [narrative-content-thumbnail.webp](narrative-content-thumbnail.webp) | 四領域全覽的創作本局部           | 320×137  |  14,624 bytes |

四角紙底約 RGB 249–253／246–248／236–238，略暖於其他圖；保留原色與四邊短漸隱，不為此更改全站底色或加濾鏡。處理沿用 RGB、Lanczos、WebP 品質 88，無重繪或生成編輯。任務副本為 `assets/narrative-{mother,focus,thumbnail}.webp`，獨立紀錄見 [artwork-narrative.json](../../../doc/design/four-worlds-20261010/assets/artwork-narrative.json)，重製使用 `--area narrative`。四張原圖雜湊各不相同，不再保留缺圖的「02」顯示狀態。
