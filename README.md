# Maplegg

Maplegg 是一個用來整理《新楓之谷》Boss 結晶石收益的工具，支援多角色管理、每週與每月 Boss 規劃、分帳試算，以及本地資料保存。

## 功能

- 多角色管理
- 每個角色獨立的 Boss 規劃
- 每週 / 每月 Boss 分頁
- 同一個 Boss 以單列顯示，難度可直接下拉切換
- 同 Boss 不同難度互斥選擇
- 多人分帳試算
- 每週收益 / 每月收益 / 月收益 / 年收益摘要
- 搜尋、排序、只看已勾選
- localStorage 自動保存
- JSON 匯入 / 匯出
- 亮色 / 深色模式切換

## 技術棧

- Vue 3
- Vite
- 原生 CSS

## 安裝與啟動

```bash
npm install
npm run dev
```

預設開發環境會由 Vite 啟動。

## 建置

```bash
npm run build
```

## 使用方式

1. 新增角色
2. 切換到要編輯的角色
3. 在每週或每月分頁中選擇 Boss
4. 針對每個 Boss 用下拉選單切換難度
5. 若該 Boss 支援多人分帳，可調整隊伍人數
6. 在上方摘要查看總收益

## 資料說明

Boss 資料定義於：

- `src/data/bosses.js`

職業清單定義於：

- `src/data/jobs.js`

應用程式狀態會儲存在瀏覽器 localStorage。

## 重要檔案

- `src/App.vue`：主狀態管理、角色切換、Boss 勾選與收益計算
- `src/components/CharacterCard.vue`：角色卡 UI
- `src/components/BossCheckboxList.vue`：Boss 清單 UI
- `src/components/SummaryBar.vue`：頂部收益摘要
- `src/styles.css`：全站樣式
- `src/data/bosses.js`：Boss 結晶石資料
- `src/data/jobs.js`：職業清單

## 目前行為重點

- 每個角色的 Boss 勾選互相獨立
- 每週 Boss 上限為 12 隻
- 切換同一個 Boss 的難度時，會保留該 Boss 的選取狀態並沿用分帳設定
- 清除、刪除等操作會要求確認

## 備註

Boss 結晶石資料目前依專案內資料檔維護，若遊戲版本更新，需要同步更新 `src/data/bosses.js`。
