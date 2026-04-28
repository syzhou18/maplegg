<script setup>
import { computed, ref, watch } from "vue";
import CharacterCard from "./components/CharacterCard.vue";
import BossCheckboxList from "./components/BossCheckboxList.vue";
import SummaryBar from "./components/SummaryBar.vue";
import { BOSS_DATA, DATA_META, DIFFICULTY_OPTIONS } from "./data/bosses";
import { JOB_OPTIONS } from "./data/jobs";
import { formatMeso } from "./utils/mesoFormat";

const STORAGE_KEY = "maple_weekly_crystal_calculator_v1";

function createId() {
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}
 
function createCharacter() {
  return {
    id: createId(),
    job: JOB_OPTIONS[0],
    selectedBossIds: [],
    filters: {
      search: "",
      difficulty: "all",
      sort: "price_desc",
      selectedOnly: false,
      activeTab: "weekly",
    },
  };
}

function normalizeCharacter(character) {
  return {
    id: character.id || createId(),
    job: JOB_OPTIONS.includes(character.job) ? character.job : JOB_OPTIONS[0],
    selectedBossIds: Array.isArray(character.selectedBossIds) ? character.selectedBossIds : [],
    filters: {
      search: character.filters?.search || "",
      difficulty: character.filters?.difficulty || "all",
      sort: character.filters?.sort || "price_desc",
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

function getCharacterTotalByResetType(character, resetType) {
  return character.selectedBossIds.reduce((sum, bossId) => {
    const boss = BOSS_DATA.find((item) => item.id === bossId);
    if (!boss || boss.resetType !== resetType) return sum;
    return sum + boss.crystalPrice;
  }, 0);
}

function getCharacterSelectedCountByResetType(character, resetType) {
  return character.selectedBossIds.reduce((count, bossId) => {
    const boss = BOSS_DATA.find((item) => item.id === bossId);
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

const activeBosses = computed(() => {
  if (!activeCharacter.value) return [];
  return getFilteredBosses(activeCharacter.value, activeCharacter.value.filters.activeTab);
});

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
    const targetBoss = BOSS_DATA.find((item) => item.id === bossId);
    if (!targetBoss) return character;
    const exists = character.selectedBossIds.includes(bossId);
    const selectedBossIds = checked
      ? exists
        ? character.selectedBossIds
        : [
            ...character.selectedBossIds.filter((id) => {
              const selectedBoss = BOSS_DATA.find((item) => item.id === id);
              return selectedBoss?.bossName !== targetBoss.bossName;
            }),
            bossId,
          ]
      : character.selectedBossIds.filter((id) => id !== bossId);
    return {
      ...character,
      selectedBossIds,
    };
  });
}

function clearAll() {
  if (!window.confirm("要清除所有角色與 Boss 勾選資料嗎？")) return;
  characters.value = [];
  activeCharacterId.value = null;
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
        <button class="ghost-btn" type="button" @click="clearAll">清除全部資料</button>
      </div>
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
              @input="updateCharacter(activeCharacter.id, { ...activeCharacter, filters: { ...activeCharacter.filters, search: $event.target.value } })"
            />
          </label>
          <label>
            <span>難度篩選</span>
            <select
              :value="activeCharacter.filters.difficulty"
              @change="updateCharacter(activeCharacter.id, { ...activeCharacter, filters: { ...activeCharacter.filters, difficulty: $event.target.value } })"
            >
              <option value="all">全部</option>
              <option v-for="difficulty in DIFFICULTY_OPTIONS" :key="difficulty" :value="difficulty">
                {{ difficulty }}
              </option>
            </select>
          </label>
          <label>
            <span>價格排序</span>
            <select
              :value="activeCharacter.filters.sort"
              @change="updateCharacter(activeCharacter.id, { ...activeCharacter, filters: { ...activeCharacter.filters, sort: $event.target.value } })"
            >
              <option value="price_desc">由高到低</option>
              <option value="price_asc">由低到高</option>
              <option value="level_desc">建議等級</option>
              <option value="boss_asc">Boss 名稱</option>
            </select>
          </label>
          <label class="checkbox-label">
            <input
              :checked="activeCharacter.filters.selectedOnly"
              type="checkbox"
              @change="updateCharacter(activeCharacter.id, { ...activeCharacter, filters: { ...activeCharacter.filters, selectedOnly: $event.target.checked } })"
            />
            <span>只看已勾選</span>
          </label>
        </div>

        <div class="boss-tabs" role="tablist" aria-label="Boss 分頁">
          <button
            class="tab-btn"
            :class="{ active: activeCharacter.filters.activeTab === 'weekly' }"
            type="button"
            @click="updateCharacter(activeCharacter.id, { ...activeCharacter, filters: { ...activeCharacter.filters, activeTab: 'weekly' } })"
          >
            每週 Boss
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeCharacter.filters.activeTab === 'monthly' }"
            type="button"
            @click="updateCharacter(activeCharacter.id, { ...activeCharacter, filters: { ...activeCharacter.filters, activeTab: 'monthly' } })"
          >
            每月 Boss
          </button>
        </div>

        <BossCheckboxList
          :bosses="activeBosses"
          :selected-boss-ids="activeCharacter.selectedBossIds"
          @toggle="toggleBoss(activeCharacter.id, $event.bossId, $event.checked)"
        />
      </section>
    </main>
  </div>
</template>
