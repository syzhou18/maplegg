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

function patchCharacter(patch) {
  emit("update:character", {
    ...props.character,
    ...patch,
  });
}
</script>

<template>
  <article class="character-card compact" :class="{ active: isActive }">
    <button class="character-select-layer" type="button" @click="$emit('select')" :aria-pressed="isActive" />

    <div class="character-card-top">
      <div>
        <div class="card-kicker">角色卡</div>
        <h3 class="character-card-title">{{ characterTitle }}</h3>
      </div>
      <div class="character-badges">
        <span class="count-badge">{{ selectedCount }}/12</span>
        <span v-if="isActive" class="active-badge">編輯中</span>
      </div>
    </div>

    <label class="character-job-field">
      <span>職業</span>
      <select :value="character.job" @change="patchCharacter({ job: $event.target.value })">
        <option v-for="job in jobOptions" :key="job" :value="job">{{ job }}</option>
      </select>
    </label>

    <div class="character-totals">
      <div class="character-total-block">
        <span class="income-label">每週</span>
        <strong class="character-total-value">{{ formatMeso(weeklyTotal) }}</strong>
      </div>
      <div class="character-total-block monthly">
        <span class="income-label">每月</span>
        <strong class="character-total-value">{{ formatMeso(monthlyTotal) }}</strong>
      </div>
    </div>

    <div class="character-card-actions">
      <button class="ghost-btn small" type="button" @click="$emit('select')">
        {{ isActive ? "目前角色" : "切換到這隻" }}
      </button>
      <button class="text-btn" type="button" @click="$emit('delete')">刪除</button>
    </div>
  </article>
</template>
