<script setup>
defineProps({
  summary: {
    type: Object,
    required: true,
  },
  dataMeta: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="summary-grid" aria-label="總覽統計">
    <article class="summary-card">
      <span class="summary-label">每週總收入</span>
      <strong class="summary-value">{{ summary.weeklyTotalText }}楓幣</strong>
    </article>
    <article class="summary-card">
      <span class="summary-label">每月 Boss 收入</span>
      <strong class="summary-value">{{ summary.monthlyTotalText }}楓幣</strong>
    </article>
    <article class="summary-card">
      <span class="summary-label">月收入</span>
      <strong class="summary-value">{{ summary.blendedMonthlyText }}楓幣</strong>
    </article>
    <article class="summary-card">
      <span class="summary-label">年收入</span>
      <strong class="summary-value">{{ summary.yearlyTotalText }}楓幣</strong>
    </article>
    <article class="summary-card">
      <span class="summary-label">角色數量</span>
      <strong class="summary-value">{{ summary.totalCharacters }} 隻</strong>
    </article>
    <article class="summary-card">
      <span class="summary-label">已勾選 Boss</span>
      <strong class="summary-value">{{ summary.totalSelectedBosses }} 個</strong>
    </article>
    <article class="summary-card">
      <span class="summary-label">資料版本</span>
      <strong class="summary-value">{{ dataMeta.version }}</strong>
    </article>
    <article class="summary-card">
      <span class="summary-label">資料更新日</span>
      <strong class="summary-value">{{ dataMeta.updatedAt }}</strong>
    </article>
  </section>
</template>
