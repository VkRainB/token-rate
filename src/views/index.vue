<route>
{
  name: 'index',
  meta: {
    layout: 'default'
  }
}
</route>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import CalculatorLeftPanel from './components/CalculatorLeftPanel.vue';
import CalculatorRightPanel from './components/CalculatorRightPanel.vue';
import './components/calculator-page.css';
import type {
  CalculatorForm,
  Category,
  CostRow,
  Currency,
  RateCard,
  RechargeStats,
  Savings,
  Totals
} from './components/calculator.types';
import type { CatalogModel, CatalogModelCost } from '@/composables/useModelCatalog';

const categories = [
  {
    id: 'in',
    short: 'IN',
    priceLabel: '输入 / 1M',
    groupLabel: '输入倍率',
    tokenLabel: '输入 (Input Tokens)',
    displayLabel: '输入',
    bgClass: 'bg-blue',
    borderClass: 'border-blue',
    priceKey: 'pIn',
    groupKey: 'grIn',
    tokenKey: 'tokIn'
  },
  {
    id: 'out',
    short: 'OT',
    priceLabel: '输出 / 1M',
    groupLabel: '输出倍率',
    tokenLabel: '输出 (Output Tokens)',
    displayLabel: '输出',
    bgClass: 'bg-orange',
    borderClass: 'border-orange',
    priceKey: 'pOut',
    groupKey: 'grOut',
    tokenKey: 'tokOut'
  },
  {
    id: 'cr',
    short: 'CR',
    priceLabel: '读取缓存 / 1M',
    groupLabel: '读取倍率',
    tokenLabel: '缓存读取 (Cache Read)',
    displayLabel: '读取',
    bgClass: 'bg-green',
    borderClass: 'border-green',
    priceKey: 'pCR',
    groupKey: 'grCR',
    tokenKey: 'tokCR'
  },
  {
    id: 'cc',
    short: 'CW',
    priceLabel: '写入缓存 / 1M',
    groupLabel: '写入倍率',
    tokenLabel: '缓存写入 (Cache Write)',
    displayLabel: '写入',
    bgClass: 'bg-purple',
    borderClass: 'border-purple',
    priceKey: 'pCC',
    groupKey: 'grCC',
    tokenKey: 'tokCC'
  }
] as const satisfies readonly Category[];

const form = reactive<CalculatorForm>({
  pIn: 5,
  pOut: 25,
  pCR: 0.5,
  pCC: 6.25,
  exRate: 7.25,
  groupRate: 1,
  grIn: 1,
  grOut: 1,
  grCR: 1,
  grCC: 1,
  rechargeAmount: 10,
  rechargePoints: 1000,
  tokIn: 37,
  tokOut: 916,
  tokCR: 72801,
  tokCC: 1368
});

const detailMode = ref(false);
const rechargeCurrency = ref<Currency>('CNY');
const currentModel = ref<{ modelName: string; providerName: string } | null>(null);

function formatUsd(value: number) {
  return `$${value.toFixed(6)}`;
}

function formatCny(value: number) {
  return `¥${value.toFixed(6)}`;
}

function formatPoints(value: number) {
  return `${value.toFixed(2)} 积分`;
}

function toggleDetail() {
  detailMode.value = !detailMode.value;

  if (detailMode.value) {
    form.grIn = form.groupRate;
    form.grOut = form.groupRate;
    form.grCR = form.groupRate;
    form.grCC = form.groupRate;
  }
}

function setRechargeCurrency(currency: Currency) {
  rechargeCurrency.value = currency;
}

function applyModelCost(cost: CatalogModelCost) {
  if (cost.input != null) form.pIn = cost.input;
  if (cost.output != null) form.pOut = cost.output;
  if (cost.cacheRead != null) form.pCR = cost.cacheRead;
  if (cost.cacheWrite != null) form.pCC = cost.cacheWrite;
}

function applyModel(model: CatalogModel) {
  applyModelCost(model.cost);
  currentModel.value = { modelName: model.modelName, providerName: model.providerName };
}

function clearCurrentModel() {
  currentModel.value = null;
}

const exchangeRate = computed(() => form.exRate || 7.25);

const rawUsd = computed(() => [form.pIn, form.pOut, form.pCR, form.pCC]);

const multipliers = computed(() => {
  if (detailMode.value) {
    return [form.grIn, form.grOut, form.grCR, form.grCC];
  }

  return Array(4).fill(form.groupRate || 1);
});

const usdPrices = computed(() => rawUsd.value.map((price, index) => price * multipliers.value[index]));

const cnyPrices = computed(() => usdPrices.value.map(price => price * exchangeRate.value));

const referencePrices = computed<string[]>(() =>
  rawUsd.value.map(price => `≈ ¥${(price * exchangeRate.value).toFixed(4)} / 1M`)
);

const effectivePrices = computed<string[]>(() =>
  rawUsd.value.map((price, index) => `实际 $${(price * multipliers.value[index]).toFixed(4)} / 1M`)
);

const rechargeStats = computed<RechargeStats>(() => {
  const rechargeAmount = form.rechargeAmount || 10;
  const rechargePoints = form.rechargePoints || 1000;
  const usd = rechargeCurrency.value === 'USD' ? rechargeAmount : rechargeAmount / exchangeRate.value;
  const cny = usd * exchangeRate.value;
  const pointsPerUsd = usd > 0 ? rechargePoints / usd : 0;
  const pointsPerCny = cny > 0 ? rechargePoints / cny : 0;
  const cnyPerPoint = rechargePoints > 0 ? cny / rechargePoints : 0;
  const usdPerPoint = exchangeRate.value > 0 ? cnyPerPoint / exchangeRate.value : 0;

  return {
    pointsPerUsd,
    unit: rechargeCurrency.value,
    perPointText: `¥${cnyPerPoint.toFixed(4)} / $${usdPerPoint.toFixed(4)}`,
    perCnyText: `${pointsPerCny.toFixed(2)} 积分`,
    perUsdText: `${pointsPerUsd.toFixed(2)} 积分`
  };
});

const rateCards = computed<RateCard[]>(() =>
  categories.map((category, index) => {
    const usdPrice = usdPrices.value[index];
    const cnyPrice = cnyPrices.value[index];
    const pointsPrice = usdPrice * rechargeStats.value.pointsPerUsd;

    return {
      ...category,
      usdText: `$${usdPrice.toFixed(4)}`,
      cnyText: `¥${cnyPrice.toFixed(4)} / 1M`,
      pointsText: `${Math.round(pointsPrice)} 积分 / 1M`,
      multiplierText: detailMode.value
        ? `× ${multipliers.value[index].toFixed(2)} 独立倍率`
        : `× ${multipliers.value[index].toFixed(2)} 统一倍率`
    };
  })
);

const costRows = computed<CostRow[]>(() =>
  categories.map((category, index) => {
    const tokenValue = form[category.tokenKey];
    const usdCost = (tokenValue / 1e6) * usdPrices.value[index];
    const cnyCost = usdCost * exchangeRate.value;
    const pointsCost = usdCost * rechargeStats.value.pointsPerUsd;

    return {
      ...category,
      usdCost,
      usdText: formatUsd(usdCost),
      cnyText: formatCny(cnyCost),
      pointsText: formatPoints(pointsCost)
    };
  })
);

const totals = computed<Totals>(() => {
  const usd = costRows.value.reduce((sum, item) => sum + item.usdCost, 0);
  const cny = usd * exchangeRate.value;
  const points = usd * rechargeStats.value.pointsPerUsd;

  return {
    usd,
    usdText: formatUsd(usd),
    cnyText: formatCny(cny),
    pointsText: formatPoints(points)
  };
});

const savings = computed<Savings>(() => {
  const savedUsd = (form.tokCR / 1e6) * (usdPrices.value[0] - usdPrices.value[2]);
  const withoutCache = totals.value.usd + savedUsd;
  const percent = withoutCache > 0 ? Math.min(100, (savedUsd / withoutCache) * 100) : 0;

  return {
    percentText: `${percent.toFixed(1)}%`,
    note:
      percent > 0
        ? `由于启用了 Context Caching，共节省了 ${formatUsd(savedUsd)} (约 ${formatCny(savedUsd * exchangeRate.value)})`
        : '当前无缓存读取，未产生节省费用'
  };
});
</script>

<template>
  <div class="calculator-page">
    <div class="ambient-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="root">
      <div class="grid">
        <CalculatorLeftPanel
          :categories="categories"
          :form="form"
          :detail-mode="detailMode"
          :recharge-currency="rechargeCurrency"
          :reference-prices="referencePrices"
          :effective-prices="effectivePrices"
          :recharge-stats="rechargeStats"
          :rate-cards="rateCards"
          :current-model="currentModel"
          @toggle-detail="toggleDetail"
          @set-recharge-currency="setRechargeCurrency"
          @apply-model="applyModel"
          @clear-model="clearCurrentModel"
        />

        <CalculatorRightPanel
          :categories="categories"
          :form="form"
          :cost-rows="costRows"
          :totals="totals"
          :savings="savings"
        />
      </div>
    </div>
  </div>
</template>
