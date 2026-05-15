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

const emit = defineEmits(["toggle", "update-party-size"]);
const selectedSet = computed(() => new Set(props.selectedBossIds));

function onToggle(bossId, checked) {
  emit("toggle", { bossId, checked });
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
    <div class="boss-list-head">
      <span>Boss 與難度</span>
      <span>價格 / 實拿</span>
      <span>重置</span>
      <span>團打</span>
      <span>勾選</span>
    </div>

    <div v-if="bosses.length === 0" class="empty-state">目前沒有符合條件的 Boss。</div>

    <label
      v-for="boss in bosses"
      :key="boss.id"
      class="boss-row"
      :class="{ disabled: isBossDisabled(boss) }"
      :for="boss.id"
    >
      <div class="boss-main">
        <strong class="boss-name">{{ boss.bossName }}</strong>
        <div class="boss-detail-line">
          <span class="boss-difficulty">{{ boss.difficulty }}</span>
          <span class="boss-sub">建議等級 {{ boss.level }}</span>
        </div>
      </div>

      <div class="boss-price-stack">
        <span class="boss-price">{{ formatMeso(boss.crystalPrice) }}</span>
        <span v-if="selectedSet.has(boss.id) && (boss.maxPartySize || 1) > 1" class="boss-share-price">
          實拿 {{ formatMeso(getBossSplitPrice(boss.id)) }}
        </span>
      </div>
      <span class="boss-reset">{{ boss.resetType }}</span>
      <div class="boss-party">
        <template v-if="(boss.maxPartySize || 1) > 1">
          <select
            class="party-select"
            :value="getSelectedPartySize(boss.id)"
            :disabled="!selectedSet.has(boss.id)"
            @change="onPartySizeChange(boss.id, $event.target.value)"
          >
            <option v-for="size in getPartySizeOptions(boss)" :key="size" :value="size">{{ size }} 人</option>
          </select>
          <span class="boss-party-hint">{{ getPartySizeLabel(boss) }}</span>
        </template>
        <span v-else class="boss-party-static">單人</span>
      </div>

      <div class="boss-check">
        <input
          :id="boss.id"
          :checked="selectedSet.has(boss.id)"
          :disabled="isBossDisabled(boss)"
          type="checkbox"
          @change="onToggle(boss.id, $event.target.checked)"
        />
      </div>
    </label>
  </div>
</template>
