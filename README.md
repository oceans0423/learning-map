# 人文跨域與應用學系課程地圖

以 React、TypeScript 與 Vite 建立的互動式四年課程地圖，包含 69 門課程、學期切換、面向與作用強調、課程詳情及可分享的 URL 狀態。

## 本機開發

```sh
npm ci
npm run dev
```

開啟終端顯示的本機網址，預設為 `http://localhost:5173/`。

## 驗證與建置

```sh
npm test
npm run lint
npm run format:check
npm run build
```

建置產物位於 `dist/`。尚待瀏覽器實視驗收、官方連結與正式部署設定。

## 專案文件

- [開發 PRD](doc/PRD_interactive_curriculum_learning_map_v1.2.md)
- [任務與驗收狀態](TASKS_v1.md)
- [課程資料](doc/course/courses_v1.json)

課程分類與內容核定狀態以資料中的 `verification` 欄位為準。
