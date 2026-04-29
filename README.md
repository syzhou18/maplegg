# maplegg 專案整理狀態

這個專案已經從靜態頁面整理成 **Vue 3 + Vite** 結構，核心功能已經可用。

## 已完成核心功能

- 多角色管理
- 角色卡切換
- Boss 工作區獨立編輯
- 每週 / 每月 Boss 分頁
- Boss 搜尋、難度篩選、排序
- 即時計算：
  - 每週收入
  - 每月 Boss 收入
  - 月收入
  - 年收入
- localStorage 保存資料
- 刪除角色前確認提示
- 同 Boss 不同難度只能勾一個
- 角色卡顯示每週已勾選數 `x/12`
- 已勾選數只統計每週 Boss，不含每月 Boss

---

## 目前已完成的修改

專案已改成 Vite 結構，主要入口為：

- `package.json`
- `index.html`
- `src/main.js`

角色與 Boss UI 已拆開：

- 上方角色卡區
- 下方 Boss 工作區

角色操作邏輯：

- 新增角色後會自動切到新角色
- 刪除目前角色會自動切到下一張角色卡

最上方摘要目前有：

- 每週總收入
- 每月 Boss 收入
- 月收入 = 每週總收入 × 4 + 每月 Boss 收入
- 年收入 = 月收入 × 12
- 角色數量
- 已勾選 Boss
- 資料版本
- 資料更新日

Boss 排序功能已新增：

- 建議等級排序

其他已完成項目：

- 角色卡刪除有 `confirm`
- 整體配色已改成明亮版

---

## 尚未完成 / TODO

---

## 重要檔案

### `src/App.vue`

負責：

- 主狀態管理
- localStorage
- 角色切換
- 角色刪除
- Boss 勾選邏輯
- 收入摘要計算

---

### `src/components/CharacterCard.vue`

負責角色卡 UI：

- 顯示每週 Boss 勾選數 `x/12`
- 職業選擇
- 切換角色
- 刪除角色

---

### `src/components/BossCheckboxList.vue`

負責：

- Boss 列表勾選 UI

---

### `src/components/SummaryBar.vue`

負責：

- 頂部摘要區

---

### `src/styles.css`

負責：

- 全站配色
- 全站版面樣式

---

### `src/data/bosses.js`

負責：

- Boss 資料

目前最需要整理的檔案。

---

### `src/data/jobs.js`

負責：

- 職業清單
