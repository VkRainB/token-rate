<script setup lang="ts">
import type {
  CalculatorForm,
  Category,
  CostRow,
  Savings,
  Totals
} from './calculator.types';

defineProps<{
  categories: readonly Category[];
  form: CalculatorForm;
  costRows: CostRow[];
  totals: Totals;
  savings: Savings;
}>();
</script>

<template>
  <div class="card right-card">
    <section class="panel-section panel-section-token">
      <div class="section-topline">
        <div class="sec-title">实际消耗 Token</div>
      </div>
      <div class="token-grid">
        <div v-for="item in categories" :key="`${item.id}-token`" class="field token-field">
          <label>
            <span class="icon-box" :class="item.bgClass">{{ item.short }}</span>
            {{ item.tokenLabel }}
          </label>
          <input v-model.number="form[item.tokenKey]" type="number" min="0" step="1" />
        </div>
      </div>
    </section>

    <section class="panel-section panel-section-bill">
      <div class="section-topline bill-headline">
        <div class="sec-title">费用账单明细</div>
        <div class="cols-header">
          <span class="cols-header-item cols-usd">USD $</span>
          <span class="cols-header-item cols-cny">CNY ¥</span>
          <span class="cols-header-item cols-pts">积分</span>
        </div>
      </div>

      <div class="result-list">
        <div v-for="row in costRows" :key="`${row.id}-cost`" class="result-row">
          <span class="result-label">
            <span class="icon-box" :class="row.bgClass">{{ row.short }}</span>
            {{ row.displayLabel }}
          </span>
          <div class="result-vals">
            <span class="r-usd">{{ row.usdText }}</span>
            <span class="r-cny">{{ row.cnyText }}</span>
            <span class="r-pts">{{ row.pointsText }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="panel-section panel-section-summary">
      <div class="total-row">
        <span class="total-label">总计估算</span>
        <div class="total-vals">
          <span class="total-usd">{{ totals.usdText }}</span>
          <span class="total-cny">{{ totals.cnyText }}</span>
          <span class="total-pts">{{ totals.pointsText }}</span>
        </div>
      </div>

      <div class="savings-bar">
        <div class="savings-label">
          <span>命中缓存为您节省</span>
          <span class="savings-percent">{{ savings.percentText }}</span>
        </div>
        <div class="bar-wrap">
          <div class="bar-fill" :style="{ width: savings.percentText }"></div>
        </div>
        <div class="savings-note">{{ savings.note }}</div>
      </div>
    </section>
  </div>
</template>
