<script setup lang="ts">
import { ref } from 'vue';
import type {
  CalculatorForm,
  Category,
  Currency,
  RateCard,
  RechargeStats
} from './calculator.types';
import ModelPickerDialog from './ModelPickerDialog.vue';
import type { CatalogModel } from '@/composables/useModelCatalog';
import { X } from 'lucide-vue-next';

defineProps<{
  categories: readonly Category[];
  form: CalculatorForm;
  detailMode: boolean;
  rechargeCurrency: Currency;
  referencePrices: string[];
  effectivePrices: string[];
  rechargeStats: RechargeStats;
  rateCards: RateCard[];
  currentModel: { modelName: string; providerName: string } | null;
}>();

const emit = defineEmits<{
  (event: 'toggle-detail'): void;
  (event: 'set-recharge-currency', currency: Currency): void;
  (event: 'apply-model', model: CatalogModel): void;
  (event: 'clear-model'): void;
}>();

const pickerOpen = ref(false);

function onModelSelected(model: CatalogModel) {
  emit('apply-model', model);
}
</script>

<template>
  <div class="card left-card">
    <section class="panel-section panel-section-price">
      <div class="section-topline">
        <div class="sec-title">单价配置 (USD)</div>
        <button type="button" class="toggle-detail-btn pick-model-btn" @click="pickerOpen = true">
          选择模型
        </button>
      </div>

      <div v-if="currentModel" class="current-model-chip">
        <span class="cmc-label">模型</span>
        <span class="cmc-text">{{ currentModel.modelName }} · {{ currentModel.providerName }}</span>
        <button type="button" class="cmc-close" title="清除当前模型标识" @click="emit('clear-model')">
          <X class="cmc-icon" />
        </button>
      </div>

      <div class="price-grid">
        <div v-for="(item, index) in categories" :key="item.id" class="price-item">
          <label>
            <span class="icon-box" :class="item.bgClass">{{ item.short }}</span>
            {{ item.priceLabel }}
          </label>
          <div class="price-input-wrap">
            <input v-model.number="form[item.priceKey]" type="number" min="0" step="0.01" />
            <span class="price-unit">$</span>
          </div>
          <div class="ref-row">{{ referencePrices[index] }}</div>
        </div>
      </div>
    </section>

    <div class="left-control-grid">
      <section class="panel-section panel-section-group">
        <div class="section-topline">
          <div class="sec-title">分组倍率</div>
          <button type="button" class="toggle-detail-btn" :class="{ on: detailMode }" @click="emit('toggle-detail')">
            <span>{{ detailMode ? '收起' : '展开' }}</span>
            详细模式
          </button>
        </div>

        <div class="group-switch-area">
          <div v-if="!detailMode" class="group-simple-row">
            <label>统一倍率</label>
            <input v-model.number="form.groupRate" type="number" min="0" step="0.01" />
            <span class="hint">所有类型共用</span>
          </div>

          <div v-else class="group-detail-grid">
            <div v-for="(item, index) in categories" :key="`${item.id}-detail`" class="gd-item">
              <label>{{ item.groupLabel }}</label>
              <input v-model.number="form[item.groupKey]" type="number" min="0" step="0.01" />
              <div class="gd-effective">{{ effectivePrices[index].replace('实际 ', '') }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="panel-section panel-section-recharge">
      <div class="section-topline">
        <div class="recharge-heading">
          <div class="sec-title">充值比例</div>
          <div class="recharge-toolbar">
            <div class="currency-toggle">
              <button type="button" :class="{ active: rechargeCurrency === 'CNY' }"
                @click="emit('set-recharge-currency', 'CNY')">
                ¥ CNY
              </button>
              <button type="button" :class="{ active: rechargeCurrency === 'USD' }"
                @click="emit('set-recharge-currency', 'USD')">
                $ USD
              </button>
            </div>

            <div class="exchange-inline">
              <span class="exchange-inline-label">汇率</span>
              <input v-model.number="form.exRate" type="number" min="0.01" step="0.01" />
              <span class="ex-note">CNY</span>
            </div>
          </div>
        </div>
      </div>

      <div class="recharge-layout">
        <div class="recharge-side">
          <div class="recharge-row">
            <label>充值</label>
            <input v-model.number="form.rechargeAmount" type="number" min="0.01" step="0.01" />
            <span class="unit">{{ rechargeStats.unit }}</span>
            <label class="recharge-get-label">得</label>
            <input v-model.number="form.rechargePoints" type="number" min="1" step="1" />
            <span class="unit">积分</span>
          </div>

          <div class="derived-row">
            <div class="derived-item">
              <span class="d-label">1 积分 =</span>
              <span class="d-val">{{ rechargeStats.perPointText }}</span>
            </div>
            <div class="derived-item">
              <span class="d-label">1 CNY =</span>
              <span class="d-val">{{ rechargeStats.perCnyText }}</span>
            </div>
            <div class="derived-item">
              <span class="d-label">1 USD =</span>
              <span class="d-val">{{ rechargeStats.perUsdText }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel-section panel-section-rates">
      <div class="sec-title">实际计算单价</div>
      <div class="rate-grid">
        <div v-for="card in rateCards" :key="card.id" class="rate-item" :class="card.borderClass">
          <div class="rate-label">{{ card.displayLabel }}单价</div>
          <div class="rate-usd">
            {{ card.usdText }}
            <span class="rate-unit-inline">/ 1M</span>
          </div>
          <div class="rate-cny">{{ card.cnyText }}</div>
          <div class="rate-pts">{{ card.pointsText }}</div>
          <div class="rate-mult">{{ card.multiplierText }}</div>
        </div>
      </div>
    </section>

    <ModelPickerDialog v-model:open="pickerOpen" @select="onModelSelected" />
  </div>
</template>
