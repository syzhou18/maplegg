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
  <section class="summary-section" aria-label="總覽統計">
    <div class="summary-feature-card">
      <div class="summary-feature-head">
        <div>
          <div class="card-kicker">總覽</div>
          <h2 class="summary-feature-title">每週收益</h2>
        </div>
      </div>
      <strong class="summary-feature-value">{{ summary.weeklyTotalText }} 楓幣</strong>
    </div>

    <div class="summary-secondary-grid">
      <article class="summary-card tone-cyan">
        <span class="summary-label">每月 Boss 收入</span>
        <strong class="summary-value">{{ summary.monthlyTotalText }} 楓幣</strong>
      </article>
      <article class="summary-card tone-purple">
        <span class="summary-label">預估月收入</span>
        <strong class="summary-value">{{ summary.blendedMonthlyText }} 楓幣</strong>
      </article>
      <article class="summary-card tone-gold">
        <span class="summary-label">預估年收入</span>
        <strong class="summary-value">{{ summary.yearlyTotalText }} 楓幣</strong>
      </article>
      <article class="summary-card tone-slate compact">
        <span class="summary-label">角色數量</span>
        <strong class="summary-value">{{ summary.totalCharacters }} 隻</strong>
      </article>
      <article class="summary-card tone-slate compact">
        <span class="summary-label">已勾選每週 Boss</span>
        <strong class="summary-value">{{ summary.totalSelectedBosses }} 個</strong>
      </article>
    </div>

    <div class="summary-meta-card">
      <div>
        <span class="summary-meta-label">資料版本</span>
        <strong class="summary-meta-value">{{ dataMeta.version }}</strong>
      </div>
      <div>
        <span class="summary-meta-label">資料更新日</span>
        <strong class="summary-meta-value">{{ dataMeta.updatedAt }}</strong>
      </div>
    </div>
  </section>
</template>
