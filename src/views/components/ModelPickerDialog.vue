<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
} from 'reka-ui';
import { refDebounced } from '@vueuse/core';
import { RefreshCw, Search, X } from 'lucide-vue-next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import {
  useModelCatalog,
  type CatalogModel
} from '@/composables/useModelCatalog';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'select', model: CatalogModel): void;
}>();

const { models, loading, error, lastFetchedAt, load, refresh } = useModelCatalog();

const search = ref('');
const debouncedSearch = refDebounced(search, 250);
const providerFilter = ref<string>('');
const selectedId = ref<string>('');

const providers = computed(() => {
  const map = new Map<string, string>();
  for (const m of models.value) {
    if (!map.has(m.providerId)) map.set(m.providerId, m.providerName);
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const filtered = computed(() => {
  const kw = debouncedSearch.value.trim().toLowerCase();
  const pid = providerFilter.value;
  let list = models.value;
  if (pid) list = list.filter(m => m.providerId === pid);
  if (kw) list = list.filter(m => m.searchKey.includes(kw));
  return list.slice(0, 200);
});

const filteredTruncated = computed(() => {
  const kw = debouncedSearch.value.trim().toLowerCase();
  const pid = providerFilter.value;
  let total = models.value.length;
  if (pid || kw) {
    total = models.value.filter(m => {
      if (pid && m.providerId !== pid) return false;
      if (kw && !m.searchKey.includes(kw)) return false;
      return true;
    }).length;
  }
  return total > filtered.value.length;
});

const grouped = computed(() => {
  const groups: { providerId: string; providerName: string; items: CatalogModel[] }[] = [];
  for (const m of filtered.value) {
    const tail = groups[groups.length - 1];
    if (tail && tail.providerId === m.providerId) {
      tail.items.push(m);
    } else {
      groups.push({ providerId: m.providerId, providerName: m.providerName, items: [m] });
    }
  }
  return groups;
});

const selectedModel = computed<CatalogModel | null>(() => {
  if (!selectedId.value) return null;
  return models.value.find(m => `${m.providerId}::${m.modelId}` === selectedId.value) ?? null;
});

const updatedText = computed(() => {
  if (!lastFetchedAt.value) return '';
  return `已更新 ${dayjs(lastFetchedAt.value).fromNow()}`;
});

function updateOpen(val: boolean) {
  emit('update:open', val);
}

function selectRow(m: CatalogModel) {
  selectedId.value = `${m.providerId}::${m.modelId}`;
}

function apply() {
  if (!selectedModel.value) return;
  emit('select', selectedModel.value);
  emit('update:open', false);
}

function formatPrice(v?: number) {
  if (v == null) return '—';
  return `$${v < 1 ? v.toFixed(4) : v.toFixed(2)}`;
}

watch(
  () => props.open,
  val => {
    if (val) {
      load();
    } else {
      search.value = '';
      providerFilter.value = '';
      selectedId.value = '';
    }
  }
);
</script>

<template>
  <DialogRoot :open="open" @update:open="updateOpen">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-xl bg-background text-foreground shadow-2xl border border-border max-h-[86vh] overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border">
          <DialogTitle class="text-base font-semibold">选择模型</DialogTitle>
          <span class="text-xs text-muted-foreground">{{ updatedText }}</span>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-muted disabled:opacity-60"
              :disabled="loading"
              @click="refresh"
            >
              <RefreshCw :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" />
              {{ loading ? '更新中' : '刷新目录' }}
            </button>
            <DialogClose class="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted">
              <X class="w-4 h-4" />
            </DialogClose>
          </div>
        </div>
        <DialogDescription class="sr-only">从 models.dev 目录中选择模型并回写单价字段</DialogDescription>

        <div class="px-5 py-3 border-b border-border flex items-center gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              v-model="search"
              type="text"
              placeholder="搜索模型或厂商..."
              class="w-full h-9 pl-8 pr-3 rounded-md bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          <select
            v-model="providerFilter"
            class="h-9 px-2 rounded-md bg-muted/50 border border-border text-sm max-w-[40%]"
          >
            <option value="">全部厂商</option>
            <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>

        <div class="flex-1 overflow-y-auto px-2 py-2 min-h-[240px]">
          <div v-if="loading && models.length === 0" class="p-6 text-center text-sm text-muted-foreground">
            正在加载目录...
          </div>
          <div v-else-if="error" class="p-6 text-center text-sm text-destructive">
            {{ error.message }}
            <button type="button" class="ml-2 underline" @click="refresh">重试</button>
          </div>
          <div v-else-if="filtered.length === 0" class="p-6 text-center text-sm text-muted-foreground">
            未找到匹配的模型
          </div>
          <div v-else>
            <div v-for="g in grouped" :key="g.providerId" class="mb-2">
              <div class="sticky top-0 z-10 px-3 py-1 text-xs font-medium text-muted-foreground bg-background/90 backdrop-blur-sm">
                {{ g.providerName }}
              </div>
              <button
                v-for="m in g.items"
                :key="`${m.providerId}::${m.modelId}`"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors"
                :class="selectedId === `${m.providerId}::${m.modelId}` ? 'bg-muted ring-1 ring-ring' : ''"
                @click="selectRow(m)"
                @dblclick="selectRow(m); apply()"
              >
                <div class="min-w-0 flex-1">
                  <div class="text-sm truncate">{{ m.modelName }}</div>
                  <div class="text-xs text-muted-foreground truncate">{{ m.modelId }}</div>
                </div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <span>IN {{ formatPrice(m.cost.input) }}</span>
                  <span>OUT {{ formatPrice(m.cost.output) }}</span>
                  <span
                    v-if="m.cost.cacheRead != null"
                    class="px-1.5 py-0.5 rounded bg-accent text-accent-foreground"
                  >CR {{ formatPrice(m.cost.cacheRead) }}</span>
                  <span
                    v-if="m.cost.cacheWrite != null"
                    class="px-1.5 py-0.5 rounded bg-accent text-accent-foreground"
                  >CW {{ formatPrice(m.cost.cacheWrite) }}</span>
                </div>
              </button>
            </div>
            <div v-if="filteredTruncated" class="px-3 py-2 text-xs text-muted-foreground text-center">
              结果过多，仅显示前 200 条，请输入关键词缩小范围
            </div>
          </div>
        </div>

        <div class="border-t border-border px-5 py-3 bg-muted/30">
          <div v-if="selectedModel" class="flex flex-col gap-2">
            <div class="text-sm">
              <span class="font-medium">{{ selectedModel.modelName }}</span>
              <span class="text-muted-foreground"> · {{ selectedModel.providerName }}</span>
            </div>
            <div class="grid grid-cols-4 gap-2 text-xs">
              <div>
                <div class="text-muted-foreground">输入</div>
                <div>
                  {{ formatPrice(selectedModel.cost.input) }}
                  <span v-if="selectedModel.cost.input == null" class="text-muted-foreground">(保留当前值)</span>
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">输出</div>
                <div>
                  {{ formatPrice(selectedModel.cost.output) }}
                  <span v-if="selectedModel.cost.output == null" class="text-muted-foreground">(保留当前值)</span>
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">缓存读</div>
                <div>
                  {{ formatPrice(selectedModel.cost.cacheRead) }}
                  <span v-if="selectedModel.cost.cacheRead == null" class="text-muted-foreground">(保留当前值)</span>
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">缓存写</div>
                <div>
                  {{ formatPrice(selectedModel.cost.cacheWrite) }}
                  <span v-if="selectedModel.cost.cacheWrite == null" class="text-muted-foreground">(保留当前值)</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-muted-foreground">未选中模型 · 未提供的字段将保留当前值</div>
          <div class="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-8 px-3 rounded-md text-sm hover:bg-muted border border-border"
              @click="updateOpen(false)"
            >取消</button>
            <button
              type="button"
              class="h-8 px-4 rounded-md text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              :disabled="!selectedModel"
              @click="apply"
            >应用</button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
