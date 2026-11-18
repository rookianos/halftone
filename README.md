# CHRNC HALFTONE WORKS

靜態網版圖像工具，支援繁體中文、简体中文、圖片與影片匯入，以及 PNG／SVG 匯出。素材在瀏覽器內處理。

## 本機使用

解壓縮後，用瀏覽器開啟 index.html。無需安裝依賴或執行建置。

## 發布到 GitHub Pages

1. 將解壓縮後的檔案放到 GitHub repository 根目錄，讓 index.html、studio-v12.js 和 cnc-logo.svg 位於同一層。
2. 到 Settings → Pages，將 Source 設為 **Deploy from a branch**。
3. 選擇上傳檔案的分支（通常是 main）及 **/(root)**，按 **Save**。

此靜態版本可直接開啟，沒有原 ChatGPT Sites 的私人登入門檻。

[GitHub Pages 設定文件](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 匯出規格

- 檔名固定為 `CNC_halftone_YYYYMMDD_NNN.svg` 或 `CNC_halftone_YYYYMMDD_NNN.png`，兩種格式共用當日流水號。
- Preview、SVG 及 PNG 共用平滑網紋幾何。後續版本須保留邊緣平滑取樣與向量曲線，除非使用者明確要求改動。
