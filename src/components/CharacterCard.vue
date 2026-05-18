<script setup>
import { computed } from "vue";
import { formatMeso } from "../utils/mesoFormat";

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  character: {
    type: Object,
    required: true,
  },
  jobOptions: {
    type: Array,
    required: true,
  },
  weeklyTotal: {
    type: Number,
    required: true,
  },
  monthlyTotal: {
    type: Number,
    required: true,
  },
  selectedCount: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:character", "delete", "select"]);
const characterTitle = computed(() => `角色 ${props.index + 1}`);
const isWeeklyLimitReached = computed(() => props.selectedCount >= 12);

function patchCharacter(patch) {
  emit("update:character", {
    ...props.character,
    ...patch,
  });
}
</script>

<template>
  <article class="character-card" :class="{ active: isActive, warning: isWeeklyLimitReached }">
    <button class="character-select-layer" type="button" @click="$emit('select')" :aria-pressed="isActive" />

    <div class="character-card-glow" aria-hidden="true" />

    <div class="character-card-top">
      <div>
        <div class="card-kicker">{{ characterTitle }}</div>
        <h3 class="character-card-title">{{ character.job }}</h3>
      </div>
      <div class="character-badges">
        <span class="count-badge" :class="{ warning: isWeeklyLimitReached }">每週 {{ selectedCount }}/12</span>
        <span v-if="isActive" class="active-badge">編輯中</span>
        <span v-else class="inactive-badge">可切換</span>
      </div>
    </div>

    <label class="character-job-field">
      <span>職業</span>
      <select :value="character.job" @change="patchCharacter({ job: $event.target.value })">
        <option v-for="job in jobOptions" :key="job" :value="job">{{ job }}</option>
      </select>
    </label>

    <div class="character-totals">
      <div class="character-total-block weekly">
        <span class="income-label">每週收益</span>
        <strong class="character-total-value">{{ formatMeso(weeklyTotal) }}</strong>
      </div>
      <div class="character-total-block monthly">
        <span class="income-label">每月收益</span>
        <strong class="character-total-value">{{ formatMeso(monthlyTotal) }}</strong>
      </div>
    </div>

    <div class="character-status-row">
      <span class="character-status-text">目前已配置 {{ selectedCount }} 個每週 Boss</span>
      <span v-if="isWeeklyLimitReached" class="limit-chip">已達上限</span>
    </div>

    <div class="character-card-actions">
      <span v-if="isActive" class="character-current-label">目前角色</span>
      <button v-else class="ghost-btn small" type="button" @click="$emit('select')">切換到這隻</button>
      <button class="text-btn danger-text" type="button" @click="$emit('delete')">刪除角色</button>
    </div>
  </article>
</template>
