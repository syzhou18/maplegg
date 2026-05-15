<script setup>
import { computed, ref, watch } from "vue";
import CharacterCard from "./components/CharacterCard.vue";
import BossCheckboxList from "./components/BossCheckboxList.vue";
import SummaryBar from "./components/SummaryBar.vue";
import { BOSS_DATA, DATA_META, DIFFICULTY_OPTIONS } from "./data/bosses";
import { JOB_OPTIONS } from "./data/jobs";
import { formatMeso } from "./utils/mesoFormat";

const STORAGE_KEY = "maple_weekly_crystal_calculator_v1";
const WEEKLY_BOSS_LIMIT = 12;
const importInput = ref(null);

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

function getFilteredBosses(character, activeTab) {
  const targetResetType = activeTab === "monthly" ? "每月" : "每週";
  let list = BOSS_DATA.filter((boss) => boss.resetType === targetResetType);
  const search = character.filters.search.trim();

  if (search) {
    list = list.filter((boss) => boss.bossName.includes(search));
  }
  if (character.filters.difficulty !== "all") {
    list = list.filter((boss) => boss.difficulty === character.filters.difficulty);
  }
  if (character.filters.selectedOnly) {
    list = list.filter((boss) => character.selectedBossIds.includes(boss.id));
  }

  switch (character.filters.sort) {
    case "price_asc":
      list.sort((a, b) => a.crystalPrice - b.crystalPrice);
      break;
    case "level_desc":
      list.sort((a, b) => b.level - a.level || b.crystalPrice - a.crystalPrice);
      break;
    case "boss_asc":
      list.sort((a, b) => a.bossName.localeCompare(b.bossName, "zh-Hant") || a.crystalPrice - b.crystalPrice);
      break;
    default:
      list.sort((a, b) => b.crystalPrice - a.crystalPrice);
      break;
  }

  return list;
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
  return getFilteredBosses(activeCharacter.value, activeCharacter.value.filters.activeTab);
});

const isActiveCharacterWeeklyLimitReached = computed(() => activeCharacterWeeklyCount.value >= WEEKLY_BOSS_LIMIT);

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
</script>

<template>
  <div class="page-shell">
    <header class="hero">
      <div class="hero-copy">
        <h1>新楓之谷每週結晶石計算機</h1>
        <p class="hero-text">先建立角色，再切換到下方 Boss 工作區勾選難度與計算結晶石。</p>
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
      <input ref="importInput" class="hidden-input" type="file" accept="application/json" @change="importJson" />
    </header>

    <main>
      <SummaryBar :summary="summary" :data-meta="DATA_META" />

      <section v-if="characters.length > 0" class="character-section" aria-label="角色列表">
        <div class="section-header">
          <div>
            <div class="card-kicker">角色列表</div>
            <h2 class="section-title-xl">先選角色，再編輯 Boss</h2>
          </div>
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
        <p class="empty-characters-title">目前還沒有角色</p>
        <p class="empty-characters-text">按上方「新增角色」後，再到下方 Boss 區勾選每週或每月難度。</p>
      </section>

      <section v-if="activeCharacter" class="boss-workspace" aria-label="Boss 工作區">
        <div class="boss-workspace-head">
          <div>
            <div class="card-kicker">Boss 工作區</div>
            <h2 class="section-title-xl">目前角色：{{ activeCharacter.job }}</h2>
          </div>
          <div class="workspace-income">
            <div class="workspace-income-card">
              <span class="income-label">本角色每週總和</span>
              <strong class="income-value">{{ formatMeso(activeCharacterWeeklyTotal) }}</strong>
            </div>
            <div class="workspace-income-card monthly">
              <span class="income-label">本角色每月總和</span>
              <strong class="income-value">{{ formatMeso(activeCharacterMonthlyTotal) }}</strong>
            </div>
          </div>
        </div>

        <div class="boss-controls">
          <label class="filter-wide">
            <span>搜尋 Boss</span>
            <input
              :value="activeCharacter.filters.search"
              type="search"
              placeholder="例如：咖凌、賽蓮、黑魔法師"
              @input="updateActiveCharacterFilters({ search: $event.target.value })"
            />
          </label>
          <label>
            <span>難度篩選</span>
            <select :value="activeCharacter.filters.difficulty" @change="updateActiveCharacterFilters({ difficulty: $event.target.value })">
              <option value="all">全部</option>
              <option v-for="difficulty in DIFFICULTY_OPTIONS" :key="difficulty" :value="difficulty">
                {{ difficulty }}
              </option>
            </select>
          </label>
          <label>
            <span>價格排序</span>
            <select :value="activeCharacter.filters.sort" @change="updateActiveCharacterFilters({ sort: $event.target.value })">
              <option value="price_desc">由高到低</option>
              <option value="price_asc">由低到高</option>
              <option value="level_desc">建議等級</option>
              <option value="boss_asc">Boss 名稱</option>
            </select>
          </label>
          <label class="checkbox-label">
            <input :checked="activeCharacter.filters.selectedOnly" type="checkbox" @change="updateActiveCharacterFilters({ selectedOnly: $event.target.checked })" />
            <span>只看已勾選</span>
          </label>
        </div>

        <div class="boss-meta">
          <div class="boss-meta-group">
            <span class="boss-count">已勾選每週 Boss：{{ activeCharacterWeeklyCount }}/{{ WEEKLY_BOSS_LIMIT }}</span>
            <span v-if="isActiveCharacterWeeklyLimitReached" class="limit-text">已達每週 12 隻上限，必須先取消其他每週 Boss 才能再勾選。</span>
          </div>
        </div>

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

        <BossCheckboxList
          :bosses="activeBosses"
          :selected-boss-ids="activeCharacter.selectedBossIds"
          :boss-party-sizes="activeCharacter.bossPartySizes"
          :is-boss-disabled="(boss) => isBossCheckboxDisabled(activeCharacter, boss)"
          :get-boss-split-price="(bossId) => getBossSplitPrice(activeCharacter, bossId)"
          @toggle="toggleBoss(activeCharacter.id, $event.bossId, $event.checked)"
          @update-party-size="updateBossPartySize(activeCharacter.id, $event.bossId, $event.partySize)"
        />
      </section>
    </main>
  </div>
</template>
