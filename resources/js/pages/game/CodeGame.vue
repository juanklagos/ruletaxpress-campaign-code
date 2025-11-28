<script setup lang="ts">
import axios from 'axios'
import { Head } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import WheelCard from '@/components/WheelCard.vue'
import GameForm from '@/components/GameForm.vue'
import type { CampaignData } from '@/types/campaign'

const props = defineProps<{ code: string }>()

const code = ref(props.code)
const loading = ref(true)
const error = ref<string | null>(null)
const campaign = ref<CampaignData | null>(null)
const formReady = ref(false)

const normalizedTheme = computed<'light' | 'dark'>(() => {
  const raw = campaign.value?.campaign_game?.config.form_theme
  if (!raw) {
    return 'dark'
  }
  return raw.toLowerCase() === 'light' ? 'light' : 'dark'
})

const outerThemeClass = computed(() =>
  normalizedTheme.value === 'light'
    ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900'
    : 'bg-gradient-to-br from-[#020617] via-[#050c21] to-[#020617] text-white',
)

const handleFormSubmit = (values: Record<string, string>) => {
  console.log('form submitted', values)
  formReady.value = true
}

const fetchCampaign = async (): Promise<void> => {
  loading.value = true
  error.value = null
  campaign.value = null

  try {
    const response = await axios.get<{ status: 'success' | 'error'; data: CampaignData | null; message?: string }>(
      `https://ruletaxpress.pro/api/campaigns/code/${encodeURIComponent(code.value)}`,
    )

    if (response.data.status !== 'success' || !response.data.data) {
      throw new Error(response.data.message ?? 'No se encontró una campaña válida.')
    }

    campaign.value = response.data.data
  } catch (err) {
    error.value = axios.isAxiosError(err)
      ? (err.response?.data as { message?: string })?.message ?? err.message
      : 'No se pudo obtener la campaña. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchCampaign()
})
</script>

<template>
  <Head title="Código de juego" />

  <div :class="[outerThemeClass, 'flex flex-col min-h-screen items-center justify-center px-4 py-10']">
    <div class="w-full max-w-6xl">
      <div
        :class="[
          'rounded-[32px] bg-white/80 shadow-[0_20px_50px_rgba(2,10,33,0.45)] backdrop-blur p-6 md:p-10',
          normalizedTheme.value === 'light' ? 'bg-gradient-to-b from-white to-slate-100' : '',
        ]"
      >
        <div class="flex flex-col items-stretch gap-8 md:flex-row">
        <div class="flex-1">
          <WheelCard
            :campaign="campaign"
            :title="campaign?.campaign_game?.name"
            :loading="loading"
            :error="error"
            :theme="normalizedTheme"
            :form-ready="formReady"
          />
          </div>
          <div class="flex-1">
            <GameForm :campaign="campaign" @submit="handleFormSubmit" />
          </div>
        </div>
      </div>
    </div>
        <p class="mt-3 text-xs tracking-[0.3em]">
        POWER BY RULETAXPRESS
      </p>
  </div>
</template>
