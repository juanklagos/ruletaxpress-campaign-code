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
const formValid = ref(false)
const submittedData = ref<Record<string, string> | null>(null)
const spinResult = ref<{ prize: string; formData: Record<string, string> | null } | null>(null)

const campaignImageUrl = computed<string | null>(() => {
  try {
    const media = (campaign.value as any)?.media ?? []
    const found = (media as any[]).find((m) => m?.collection === 'campaign_image')
    return found?.url ?? null
  } catch {
    return null
  }
})

const normalizedTheme = computed<'light' | 'dark'>(() => {
  const raw = campaign.value?.campaign_game?.config.form_theme
  if (!raw) {
    return 'dark'
  }
  return raw.toLowerCase() === 'light' ? 'light' : 'dark'
})

const outerThemeClass = computed(() =>
  normalizedTheme.value === 'light'
    ? 'bg-white text-slate-900'
    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white',
)

const innerContainerClass = computed(() =>
  normalizedTheme.value === 'light'
    ? 'rounded-[32px] bg-white/80 shadow-[0_20px_50px_rgba(2,10,33,0.45)] backdrop-blur p-6 md:p-10'
    : 'rounded-[32px] bg-slate-900/90 shadow-[0_20px_50px_rgba(2,10,33,0.6)] backdrop-blur p-6 md:p-10',
)

// Classes for the company name and subtitle that adapt to the current theme
const companyNameClass = computed(() => (normalizedTheme.value === 'light' ? 'text-slate-900' : 'text-white'))


const isCampaignExpired = computed<boolean>(() => {
  try {
    const raw = (campaign.value as any)?.ends_at ?? (campaign.value as any)?.campaign_game?.ends_at ?? null
    if (!raw) return false
    const ends = new Date(raw)
    if (Number.isNaN(ends.getTime())) return false
    return Date.now() > ends.getTime()
  } catch {
    return false
  }
})

const endsAtDisplay = computed<string | null>(() => {
  try {
    const raw = (campaign.value as any)?.ends_at ?? (campaign.value as any)?.campaign_game?.ends_at ?? null
    if (!raw) return null
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d.toLocaleString()
  } catch {
    return null
  }
})



const handleFormSubmit = (values: Record<string, string>) => {
  console.log('form submitted', values)
  // Save submitted data and enable the wheel
  submittedData.value = values
  formReady.value = true
}

const handleFormReady = (ready: boolean) => {
  // keep track of validation, but don't enable the wheel yet
  formValid.value = ready
}

const handleSpinFinished = (payload: { prize?: string } | any) => {
  const prize = payload?.prize ?? (payload?.result ?? 'Premio desconocido')
  spinResult.value = { prize, formData: submittedData.value }
  // Optionally, disable further spins until user resubmits
  formReady.value = false
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
      <div :class="[innerContainerClass]">
  <div v-if="isCampaignExpired" class="mb-6 rounded-md bg-red-600/95 text-white p-3 flex items-center justify-center" role="status" aria-live="polite">
    <span class="font-semibold">La campaña ha terminado</span>
    <span v-if="endsAtDisplay" class="ml-2 text-sm opacity-90">({{ endsAtDisplay }})</span>
  </div>

  <div v-if="campaignImageUrl" class="mb-10 flex flex-col items-center justify-center md:items-center gap-4">
  <img
    :src="campaignImageUrl"
    :alt="campaign?.company_name || 'Campaign image'"
    class="max-w-[250px] h-auto rounded-lg shadow-md"
  />
  <div class="text-center md:text-left">
    <h2 :class="[companyNameClass, 'text-xl md:text-2xl font-semibold tracking-tight']">{{ campaign?.company_name }}</h2>
  </div>
</div>

        <div class="flex flex-col items-center justify-center gap-8 md:flex-row">
        <div class="flex-1" :style="submittedData ? { '--wheel-size': '720px' } : {}">
          <WheelCard
            :campaign="campaign"
            :title="campaign?.campaign_game?.name"
            :loading="loading"
            :error="error"
            :theme="normalizedTheme"
            :form-ready="formReady"
            :form-data="submittedData"
            :campaign-expired="isCampaignExpired"
            :full-layout="Boolean(submittedData)"
            @finished="handleSpinFinished"
          />
          </div>
          <div v-if="!submittedData" class="flex-1">
            <GameForm :campaign="campaign" :campaign-expired="isCampaignExpired" @submit="handleFormSubmit" @ready="handleFormReady" />
          </div>
        </div>
      </div>
    </div>
          <p class="mt-3 text-xs tracking-[0.3em]">
          POWER BY RULETAXPRESS
        </p>
        <div v-if="spinResult" class="mt-6 rounded-lg border p-4 bg-white/5">
          <h3 class="text-lg font-semibold">Resultado</h3>
          <p class="mt-2 font-medium">Ganaste: <span class="text-amber-400">{{ spinResult.prize }}</span></p>
          <div v-if="spinResult.formData" class="mt-3 text-sm">
            <h4 class="font-semibold">Datos enviados:</h4>
            <ul class="mt-2 list-disc list-inside">
              <li v-for="(v, k) in spinResult.formData" :key="k">
                <strong class="mr-2">{{ k }}:</strong> {{ v }}
              </li>
            </ul>
          </div>
        </div>
  </div>
</template>
