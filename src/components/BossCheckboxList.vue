<script setup>
import { computed } from "vue";
import { formatMeso } from "../utils/mesoFormat";

const props = defineProps({
  bosses: {
    type: Array,
    required: true,
  },
  selectedBossIds: {
    type: Array,
    required: true,
  },
  bossPartySizes: {
    type: Object,
    required: true,
  },
  isBossDisabled: {
    type: Function,
    default: () => false,
  },
  getBossSplitPrice: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(["toggle", "update-party-size", "reset-boss"]);
const selectedSet = computed(() => new Set(props.selectedBossIds));

function getActiveBoss(row) {
  return row.selectedBoss || row.displayBoss;
}

function isRowSelected(row) {
  return Boolean(row.selectedBossId);
}

function onToggle(row, checked) {
  const boss = getActiveBoss(row);
  if (!boss) return;
  const bossId = checked ? boss.id : row.selectedBossId || boss.id;
  emit("toggle", { bossId, checked });
}

function onDifficultyChange(row, bossId) {
  if (!bossId) return;
  if (row.selectedBossId) {
    emit("toggle", { bossId, checked: true });
  }
}

function getPartySizeOptions(boss) {
  return Array.from({ length: boss.maxPartySize || 1 }, (_, index) => index + 1);
}

function getPartySizeLabel(boss) {
  if (!boss.maxPartySize || boss.maxPartySize <= 1) return "單吃";
  return `最多 ${boss.maxPartySize} 人`;
}

function getSelectedPartySize(bossId) {
  return props.bossPartySizes[bossId] || 1;
}

function onPartySizeChange(bossId, partySize) {
  emit("update-party-size", {
    bossId,
    partySize: Number.parseInt(partySize, 10),
  });
}
</script>

<template>
  <div class="boss-list-wrap">
    <div class="boss-list-head grouped">
      <span>Boss</span>
      <span>難度</span>
      <span>資訊</span>
      <span>分帳</span>
      <span>勾選</span>
    </div>

    <div v-if="bosses.length === 0" class="empty-state">
      目前沒有符合條件的 Boss。
    </div>

    <div
      v-for="row in bosses"
      :key="row.bossName"
      class="boss-row grouped compact no-wrap"
      :class="{ selected: isRowSelected(row), disabled: isBossDisabled(getActiveBoss(row)) }"
    >
      <div class="boss-main compact no-wrap">
        <div class="boss-title-row compact no-wrap">
          <strong class="boss-name">{{ row.bossName }}</strong>
          <span v-if="isRowSelected(row)" class="boss-selected-chip">已勾選</span>
        </div>
        <div class="boss-inline-meta no-wrap">
          <span class="boss-sub">Lv. {{ getActiveBoss(row).level }}</span>
          <span class="boss-reset-inline">{{ getActiveBoss(row).resetType }}</span>
          <span class="boss-inline-price">{{ formatMeso(getActiveBoss(row).crystalPrice) }}</span>
          <span v-if="isRowSelected(row)" class="boss-inline-share">實拿 {{ formatMeso(getBossSplitPrice(row.selectedBossId)) }}</span>
        </div>
      </div>

      <div class="boss-difficulty-select-wrap compact no-wrap">
        <select
          class="boss-difficulty-select"
          :value="row.selectedBossId || row.displayBoss.id"
          @change="onDifficultyChange(row, $event.target.value)"
        >
          <option v-for="boss in row.bosses" :key="boss.id" :value="boss.id">
            {{ boss.difficulty }}
          </option>
        </select>
      </div>

      <div class="boss-party compact no-wrap">
        <template v-if="(getActiveBoss(row).maxPartySize || 1) > 1">
          <select
            class="party-select"
            :value="getSelectedPartySize(row.selectedBossId || getActiveBoss(row).id)"
            :disabled="!isRowSelected(row)"
            @change="onPartySizeChange(row.selectedBossId || getActiveBoss(row).id, $event.target.value)"
          >
            <option v-for="size in getPartySizeOptions(getActiveBoss(row))" :key="size" :value="size">{{ size }} 人</option>
          </select>
          <span class="boss-party-hint">{{ getPartySizeLabel(getActiveBoss(row)) }}</span>
        </template>
        <span v-else class="boss-party-static">單人</span>
      </div>

      <div class="boss-check">
        <input
          :id="row.bossName"
          :checked="isRowSelected(row)"
          :disabled="isBossDisabled(getActiveBoss(row))"
          type="checkbox"
          @change="onToggle(row, $event.target.checked)"
        />
      </div>
    </div>
  </div>
</template>
