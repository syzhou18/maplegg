<script setup>
import { computed, ref, watch } from "vue";
import CharacterCard from "./components/CharacterCard.vue";
import BossCheckboxList from "./components/BossCheckboxList.vue";
import SummaryBar from "./components/SummaryBar.vue";
import { BOSS_DATA, DATA_META } from "./data/bosses";
import { JOB_OPTIONS } from "./data/jobs";
import { formatMeso } from "./utils/mesoFormat";

const STORAGE_KEY = "maple_weekly_crystal_calculator_v1";
const THEME_STORAGE_KEY = "maple_weekly_crystal_theme_v1";
const WEEKLY_BOSS_LIMIT = 12;
const importInput = ref(null);
const theme = ref(loadTheme());

function loadTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function createId() {
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}

function createCharacter() {
  return {
    id: createId(),
    job: JOB_OPTIONS[0],
    selectedBossIds: [],
    bossPartySizes: {},
    filters: {
      search: "",
      difficulty: "all",
      sort: "price_desc",
      selectedOnly: false,
      activeTab: "weekly",
    },
  };
}

function clampBossPartySize(boss, partySize) {
  const maxPartySize = boss?.maxPartySize || 1;
  const parsedSize = Number.parseInt(partySize, 10);
  if (!Number.isFinite(parsedSize)) return 1;
  return Math.min(Math.max(parsedSize, 1), maxPartySize);
}

function normalizeCharacter(character) {
  const selectedBossIds = Array.isArray(character.selectedBossIds)
    ? character.selectedBossIds.filter((bossId) => BOSS_DATA.some((boss) => boss.id === bossId))
    : [];

  const bossPartySizes = Object.fromEntries(
    selectedBossIds.map((bossId) => {
      const boss = getBossById(bossId);
      return [bossId, clampBossPartySize(boss, character.bossPartySizes?.[bossId] ?? 1)];
    }),
  );

  return {
    id: character.id || createId(),
    job: JOB_OPTIONS.includes(character.job) ? character.job : JOB_OPTIONS[0],
    selectedBossIds,
    bossPartySizes,
    filters: {
      search: character.filters?.search || "",
      difficulty: character.filters?.difficulty || "all",
      sort: ["price_desc", "price_asc", "level_desc", "boss_asc"].includes(character.filters?.sort)
        ? character.filters.sort
        : "price_desc",
      selectedOnly: Boolean(character.filters?.selectedOnly),
      activeTab: character.filters?.activeTab === "monthly" ? "monthly" : "weekly",
    },
  };
}

function loadAppState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { characters: [], activeCharacterId: null };
    const parsed = JSON.parse(raw);
    const characters = Array.isArray(parsed.characters) ? parsed.characters.map(normalizeCharacter) : [];
    const activeCharacterId = characters.some((character) => character.id === parsed.activeCharacterId)
      ? parsed.activeCharacterId
      : characters[0]?.id || null;
    return { characters, activeCharacterId };
  } catch {
    return { characters: [], activeCharacterId: null };
  }
}

const initialState = loadAppState();
const characters = ref(initialState.characters);
const activeCharacterId = ref(initialState.activeCharacterId);

watch(
  [characters, activeCharacterId],
  ([nextCharacters, nextActiveId]) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        characters: nextCharacters,
        activeCharacterId: nextActiveId,
      }),
    );
  },
  { deep: true },
);

watch(
  theme,
  (nextTheme) => {
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  },
  { immediate: true },
);

const activeCharacter = computed(
  () => characters.value.find((character) => character.id === activeCharacterId.value) || null,
);

function getBossById(bossId) {
  return BOSS_DATA.find((boss) => boss.id === bossId) || null;
}

function getBossPartySize(character, bossId) {
  const boss = getBossById(bossId);
  if (!boss) return 1;
  return clampBossPartySize(boss, character?.bossPartySizes?.[bossId] ?? 1);
}

function getBossSplitPrice(character, bossId) {
  const boss = getBossById(bossId);
  if (!boss) return 0;
  return Math.floor(boss.crystalPrice / getBossPartySize(character, bossId));
}

function getCharacterTotalByResetType(character, resetType) {
  return character.selectedBossIds.reduce((sum, bossId) => {
    const boss = getBossById(bossId);
    if (!boss || boss.resetType !== resetType) return sum;
    return sum + getBossSplitPrice(character, bossId);
  }, 0);
}

function getCharacterSelectedCountByResetType(character, resetType) {
  return character.selectedBossIds.reduce((count, bossId) => {
    const boss = getBossById(bossId);
    if (!boss || boss.resetType !== resetType) return count;
    return count + 1;
  }, 0);
}

function getBossComparator(sort) {
  switch (sort) {
    case "price_asc":
      return (a, b) => a.crystalPrice - b.crystalPrice || a.level - b.level;
    case "level_desc":
      return (a, b) => b.level - a.level || b.crystalPrice - a.crystalPrice;
    case "boss_asc":
      return (a, b) => a.bossName.localeCompare(b.bossName, "zh-Hant") || a.crystalPrice - b.crystalPrice;
    default:
      return (a, b) => b.crystalPrice - a.crystalPrice || b.level - a.level;
  }
}

function getGroupedBosses(character, activeTab, draftSelections = {}) {
  const targetResetType = activeTab === "monthly" ? "每月" : "每週";
  const search = character.filters.search.trim();
  const selectedBossIdSet = new Set(character.selectedBossIds);
  const comparator = getBossComparator(character.filters.sort);

  let list = BOSS_DATA.filter((boss) => boss.resetType === targetResetType);

  if (search) {
    list = list.filter((boss) => boss.bossName.includes(search));
  }

  const groups = list.reduce((map, boss) => {
    if (!map.has(boss.bossName)) {
      map.set(boss.bossName, []);
    }
    map.get(boss.bossName).push(boss);
    return map;
  }, new Map());

  const groupedRows = Array.from(groups.entries()).map(([bossName, bosses]) => {
    const sortedBosses = [...bosses].sort(comparator);
    const selectedBoss = sortedBosses.find((boss) => selectedBossIdSet.has(boss.id)) || null;
    const draftBoss = selectedBoss ? null : sortedBosses.find((boss) => boss.id === draftSelections[bossName]) || null;
    const displayBoss = selectedBoss || draftBoss || sortedBosses[0];

    return {
      bossName,
      bosses: sortedBosses,
      selectedBoss,
      displayBoss,
      selectedBossId: selectedBoss?.id || null,
    };
  });

  const visibleRows = character.filters.selectedOnly
    ? groupedRows.filter((row) => row.selectedBossId)
    : groupedRows;

  visibleRows.sort((a, b) => comparator(a.displayBoss, b.displayBoss));

  return visibleRows;
}

const summary = computed(() => {
  const weeklyTotalMeso = characters.value.reduce(
    (sum, character) => sum + getCharacterTotalByResetType(character, "每週"),
    0,
  );
  const monthlyTotalMeso = characters.value.reduce(
    (sum, character) => sum + getCharacterTotalByResetType(character, "每月"),
    0,
  );
  const blendedMonthlyMeso = weeklyTotalMeso * 4 + monthlyTotalMeso;
  const yearlyTotalMeso = blendedMonthlyMeso * 12;
  const totalSelectedBosses = characters.value.reduce(
    (sum, character) => sum + getCharacterSelectedCountByResetType(character, "每週"),
    0,
  );

  return {
    totalCharacters: characters.value.length,
    totalSelectedBosses,
    weeklyTotalText: formatMeso(weeklyTotalMeso),
    monthlyTotalText: formatMeso(monthlyTotalMeso),
    blendedMonthlyText: formatMeso(blendedMonthlyMeso),
    yearlyTotalText: formatMeso(yearlyTotalMeso),
  };
});

const activeCharacterWeeklyTotal = computed(() =>
  activeCharacter.value ? getCharacterTotalByResetType(activeCharacter.value, "每週") : 0,
);

const activeCharacterMonthlyTotal = computed(() =>
  activeCharacter.value ? getCharacterTotalByResetType(activeCharacter.value, "每月") : 0,
);

const activeCharacterWeeklyCount = computed(() =>
  activeCharacter.value ? getCharacterSelectedCountByResetType(activeCharacter.value, "每週") : 0,
);

const activeBosses = computed(() => {
  if (!activeCharacter.value) return [];
  return getGroupedBosses(
    activeCharacter.value,
    activeCharacter.value.filters.activeTab,
    activeBossDraftSelections.value,
  );
});

const activeBossDraftSelections = ref({});

const isActiveCharacterWeeklyLimitReached = computed(() => activeCharacterWeeklyCount.value >= WEEKLY_BOSS_LIMIT);
const activeFilterCount = computed(() => {
  if (!activeCharacter.value) return 0;
  const { search, selectedOnly } = activeCharacter.value.filters;
  return Number(Boolean(search.trim())) + Number(selectedOnly);
});

function isBossCheckboxDisabled(character, boss) {
  if (!character || !boss) return false;
  if (boss.resetType !== "每週") return false;
  if (character.selectedBossIds.includes(boss.id)) return false;
  return getCharacterSelectedCountByResetType(character, "每週") >= WEEKLY_BOSS_LIMIT;
}

function addCharacter() {
  const nextCharacter = createCharacter();
  characters.value = [...characters.value, nextCharacter];
  activeCharacterId.value = nextCharacter.id;
}

function updateCharacter(characterId, nextCharacter) {
  characters.value = characters.value.map((character) =>
    character.id === characterId ? normalizeCharacter(nextCharacter) : character,
  );
}

function updateActiveCharacterFilters(filterPatch) {
  if (!activeCharacter.value) return;
  updateCharacter(activeCharacter.value.id, {
    ...activeCharacter.value,
    filters: {
      ...activeCharacter.value.filters,
      ...filterPatch,
    },
  });
}

function resetActiveCharacterFilters() {
  if (!activeCharacter.value) return;
  updateActiveCharacterFilters({
    search: "",
    sort: "price_desc",
    selectedOnly: false,
  });
}

function updateBossPartySize(characterId, bossId, nextPartySize) {
  characters.value = characters.value.map((character) => {
    if (character.id !== characterId) return character;

    const boss = getBossById(bossId);
    if (!boss) return character;

    return {
      ...character,
      bossPartySizes: {
        ...character.bossPartySizes,
        [bossId]: clampBossPartySize(boss, nextPartySize),
      },
    };
  });
}

function updateBossDraftSelection(bossName, bossId) {
  activeBossDraftSelections.value = {
    ...activeBossDraftSelections.value,
    [bossName]: bossId,
  };
}

function resetBossSelection(characterId) {
  const character = characters.value.find((item) => item.id === characterId);
  if (!character) return;

  const nextBossPartySizes = { ...character.bossPartySizes };
  for (const bossId of character.selectedBossIds) {
    delete nextBossPartySizes[bossId];
  }

  updateCharacter(characterId, {
    ...character,
    selectedBossIds: [],
    bossPartySizes: nextBossPartySizes,
  });
}

function selectCharacter(characterId) {
  activeCharacterId.value = characterId;
}

function deleteCharacter(characterId) {
  const confirmed = window.confirm("確定要刪除這個角色嗎？");
  if (!confirmed) return;
  const nextCharacters = characters.value.filter((character) => character.id !== characterId);
  characters.value = nextCharacters;
  if (activeCharacterId.value === characterId) {
    activeCharacterId.value = nextCharacters[0]?.id || null;
  }
}

function toggleBoss(characterId, bossId, checked) {
  characters.value = characters.value.map((character) => {
    if (character.id !== characterId) return character;

    const targetBoss = getBossById(bossId);
    if (!targetBoss) return character;

    const exists = character.selectedBossIds.includes(bossId);
    if (!checked) {
      const nextPartySizes = { ...character.bossPartySizes };
      delete nextPartySizes[bossId];

      return {
        ...character,
        selectedBossIds: character.selectedBossIds.filter((id) => id !== bossId),
        bossPartySizes: nextPartySizes,
      };
    }

    if (exists) return character;

    const sameBossPartySize = character.selectedBossIds.reduce((partySize, id) => {
      const selectedBoss = getBossById(id);
      if (selectedBoss?.bossName !== targetBoss.bossName) return partySize;
      return character.bossPartySizes?.[id] ?? partySize;
    }, 1);

    const filteredIds = character.selectedBossIds.filter((id) => {
      const selectedBoss = getBossById(id);
      return selectedBoss?.bossName !== targetBoss.bossName;
    });

    const nextPartySizes = Object.fromEntries(
      Object.entries(character.bossPartySizes || {}).filter(([id]) => filteredIds.includes(id)),
    );

    if (targetBoss.resetType === "每週") {
      const weeklyCountAfterReplacingSameBoss = filteredIds.reduce((count, id) => {
        const selectedBoss = getBossById(id);
        if (!selectedBoss || selectedBoss.resetType !== "每週") return count;
        return count + 1;
      }, 0);

      if (weeklyCountAfterReplacingSameBoss >= WEEKLY_BOSS_LIMIT) {
        return {
          ...character,
          selectedBossIds: [...character.selectedBossIds],
        };
      }
    }

    return {
      ...character,
      selectedBossIds: [...filteredIds, bossId],
      bossPartySizes: {
        ...nextPartySizes,
        [bossId]: clampBossPartySize(targetBoss, sameBossPartySize),
      },
    };
  });
}

function clearAll() {
  if (!window.confirm("要清除所有角色與 Boss 勾選資料嗎？")) return;
  characters.value = [];
  activeCharacterId.value = null;
}

function exportJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    dataMeta: DATA_META,
    activeCharacterId: activeCharacterId.value,
    characters: characters.value,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "maple-crystal-calculator.json";
  link.click();
  URL.revokeObjectURL(url);
}

function triggerImport() {
  importInput.value?.click();
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const nextCharacters = Array.isArray(parsed.characters) ? parsed.characters.map(normalizeCharacter) : [];
    characters.value = nextCharacters;
    activeCharacterId.value = nextCharacters.some((character) => character.id === parsed.activeCharacterId)
      ? parsed.activeCharacterId
      : nextCharacters[0]?.id || null;
  } catch {
    window.alert("匯入失敗，請確認 JSON 格式是否正確。");
  } finally {
    event.target.value = "";
  }
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <div class="page-shell">
    <header class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Maplegg</div>
        <h1>Maplegg</h1>
      </div>

      <div class="hero-side">
        <div class="hero-panel">
          <div class="hero-panel-top">
            <div>
              <div class="card-kicker">狀態</div>
            </div>
            <button class="theme-btn" type="button" @click="toggleTheme">
              {{ theme === "dark" ? "切換亮色" : "切換深色" }}
            </button>
          </div>

          <div class="hero-panel-stats">
            <div class="hero-stat-card accent">
              <span class="hero-stat-label">角色數量</span>
              <strong class="hero-stat-value">{{ summary.totalCharacters }}</strong>
            </div>
            <div class="hero-stat-card">
              <span class="hero-stat-label">每週已選 Boss</span>
              <strong class="hero-stat-value">{{ summary.totalSelectedBosses }}</strong>
            </div>
          </div>

          <div class="hero-actions">
            <button class="primary-btn" type="button" @click="addCharacter">新增角色</button>
            <details class="actions-menu">
              <summary class="ghost-btn menu-trigger">更多操作</summary>
              <div class="actions-dropdown">
                <button class="menu-item-btn" type="button" @click="exportJson">匯出 JSON</button>
                <button class="menu-item-btn" type="button" @click="triggerImport">匯入 JSON</button>
                <button class="menu-item-btn danger" type="button" @click="clearAll">清除全部資料</button>
              </div>
            </details>
          </div>
        </div>

        <input ref="importInput" class="hidden-input" type="file" accept="application/json" @change="importJson" />
      </div>
    </header>

    <main class="page-main">
      <SummaryBar :summary="summary" :data-meta="DATA_META" />

      <section v-if="characters.length > 0" class="character-section" aria-label="角色列表">
        <div class="section-header section-header-spread">
          <div>
            <div class="card-kicker">角色</div>
            <h2 class="section-title-xl">角色列表</h2>
          </div>
          <div class="section-side-note">{{ summary.totalCharacters }} 隻</div>
        </div>

        <div class="character-grid">
          <CharacterCard
            v-for="(character, index) in characters"
            :key="character.id"
            :index="index"
            :character="character"
            :job-options="JOB_OPTIONS"
            :weekly-total="getCharacterTotalByResetType(character, '每週')"
            :monthly-total="getCharacterTotalByResetType(character, '每月')"
            :selected-count="getCharacterSelectedCountByResetType(character, '每週')"
            :is-active="character.id === activeCharacterId"
            @update:character="updateCharacter(character.id, $event)"
            @select="selectCharacter(character.id)"
            @delete="deleteCharacter(character.id)"
          />
        </div>
      </section>

      <section v-else class="empty-characters" aria-label="空角色列表">
        <div class="card-kicker">角色</div>
        <p class="empty-characters-title">沒有角色</p>
        <button class="primary-btn" type="button" @click="addCharacter">新增角色</button>
      </section>

      <section v-if="activeCharacter" class="boss-workspace" aria-label="Boss 工作區">
        <div class="boss-workspace-head">
          <div class="workspace-heading">
            <div class="card-kicker">Boss</div>
            <h2 class="section-title-xl">{{ activeCharacter.job }}</h2>
          </div>

          <div class="workspace-summary-grid">
            <div class="workspace-summary-card accent">
              <span class="workspace-summary-label">本角色每週收益</span>
              <strong class="workspace-summary-value">{{ formatMeso(activeCharacterWeeklyTotal) }}</strong>
            </div>
            <div class="workspace-summary-card success">
              <span class="workspace-summary-label">本角色每月收益</span>
              <strong class="workspace-summary-value">{{ formatMeso(activeCharacterMonthlyTotal) }}</strong>
            </div>
            <div class="workspace-summary-card" :class="{ warning: isActiveCharacterWeeklyLimitReached }">
              <span class="workspace-summary-label">每週 Boss 進度</span>
              <strong class="workspace-summary-value">{{ activeCharacterWeeklyCount }}/{{ WEEKLY_BOSS_LIMIT }}</strong>
            </div>
          </div>
        </div>

        <div class="boss-toolbar">
          <div class="boss-tabs" role="tablist" aria-label="Boss 分頁">
            <button
              class="tab-btn"
              :class="{ active: activeCharacter.filters.activeTab === 'weekly' }"
              type="button"
              @click="updateActiveCharacterFilters({ activeTab: 'weekly' })"
            >
              每週 Boss
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeCharacter.filters.activeTab === 'monthly' }"
              type="button"
              @click="updateActiveCharacterFilters({ activeTab: 'monthly' })"
            >
              每月 Boss
            </button>
          </div>

          <div class="boss-toolbar-meta">
            <button v-if="activeFilterCount > 0" class="text-btn" type="button" @click="resetActiveCharacterFilters">
              清除篩選
            </button>
          </div>
        </div>

        <div class="boss-controls aligned-controls">
          <label class="filter-wide aligned-search">
            <span>搜尋 Boss</span>
            <input
              :value="activeCharacter.filters.search"
              type="search"
              placeholder="例如：咖凌、賽蓮、黑魔法師"
              @input="updateActiveCharacterFilters({ search: $event.target.value })"
            />
          </label>
          <label class="aligned-sort">
            <span>排序方式</span>
            <select :value="activeCharacter.filters.sort" @change="updateActiveCharacterFilters({ sort: $event.target.value })">
              <option value="price_desc">價格由高到低</option>
              <option value="price_asc">價格由低到高</option>
              <option value="level_desc">建議等級</option>
              <option value="boss_asc">Boss 名稱</option>
            </select>
          </label>
          <label class="checkbox-label aligned-selected">
            <input :checked="activeCharacter.filters.selectedOnly" type="checkbox" @change="updateActiveCharacterFilters({ selectedOnly: $event.target.checked })" />
            <span>只看已勾選</span>
          </label>
          <button class="boss-reset-toolbar-btn" type="button" @click="resetBossSelection(activeCharacter.id)">
            重置
          </button>
        </div>

        <div class="boss-meta">
          <div class="boss-meta-group">
            <span class="boss-count">{{ activeCharacter.job }} 已勾選每週 Boss：{{ activeCharacterWeeklyCount }}/{{ WEEKLY_BOSS_LIMIT }}</span>
            <span v-if="isActiveCharacterWeeklyLimitReached" class="limit-text">已達每週 12 隻上限，請先取消其他每週 Boss 才能再新增。</span>
          </div>
        </div>

        <BossCheckboxList
          :bosses="activeBosses"
          :selected-boss-ids="activeCharacter.selectedBossIds"
          :boss-party-sizes="activeCharacter.bossPartySizes"
          :is-boss-disabled="(boss) => isBossCheckboxDisabled(activeCharacter, boss)"
          :get-boss-split-price="(bossId) => getBossSplitPrice(activeCharacter, bossId)"
          @toggle="toggleBoss(activeCharacter.id, $event.bossId, $event.checked)"
          @update-party-size="updateBossPartySize(activeCharacter.id, $event.bossId, $event.partySize)"
          @update-draft-selection="updateBossDraftSelection($event.bossName, $event.bossId)"
        />
      </section>
    </main>
  </div>
</template>
