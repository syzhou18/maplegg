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
});

const emit = defineEmits(["toggle"]);

const selectedSet = computed(() => new Set(props.selectedBossIds));

function onToggle(bossId, checked) {
  emit("toggle", { bossId, checked });
}
</script>

<template>
  <div class="boss-list-wrap">
    <div class="boss-list-head">
      <span>Boss 與難度</span>
      <span>價格</span>
      <span>重置</span>
      <span>勾選</span>
    </div>

    <div v-if="bosses.length === 0" class="empty-state">目前沒有符合條件的 Boss。</div>

    <label
      v-for="boss in bosses"
      :key="boss.id"
      class="boss-row"
      :for="boss.id"
    >
      <div class="boss-main">
        <strong class="boss-name">{{ boss.bossName }}</strong>
        <div class="boss-detail-line">
          <span class="boss-difficulty">{{ boss.difficulty }}</span>
          <span class="boss-sub">建議等級 {{ boss.level }}</span>
        </div>
      </div>

      <span class="boss-price">{{ formatMeso(boss.crystalPrice) }}</span>
      <span class="boss-reset">{{ boss.resetType }}</span>

      <div class="boss-check">
        <input
          :id="boss.id"
          :checked="selectedSet.has(boss.id)"
          type="checkbox"
          @change="onToggle(boss.id, $event.target.checked)"
        />
      </div>
    </label>
  </div>
</template>
