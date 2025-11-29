<script setup lang="ts">
import axios from 'axios'
import { Head } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import WheelCard from '@/components/WheelCard.vue'
import GameForm from '@/components/GameForm.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CampaignData } from '@/types/campaign'

const props = defineProps<{ code: string }>()

type ApiErrorPayload = {
  status?: string
  code?: string
  message?: string
}

type SubmissionErrorState = {
  title: string
  message: string
  code?: string
  status?: string
  httpStatus?: number
}

const code = ref(props.code)
const loading = ref(true)
const error = ref<string | null>(null)
const campaign = ref<CampaignData | null>(null)
const formReady = ref(false)
const formValid = ref(false)
const submittedData = ref<Record<string, string> | null>(null)
const submittedPlayData = ref<Record<string, { value: string; type: string; label?: string }> | null>(null)
const spinResult = ref<{
  prize: string
  formData: Record<string, string> | null
  segment?: any
  submission?: any
  serverResponse?: any
} | null>(null)
const submissionError = ref<SubmissionErrorState | null>(null)
const isErrorModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const successMessage = ref<string | null>(null)

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



const handleFormSubmit = (values: Record<string, string>, playData?: Record<string, { value: string; type: string; label?: string }>) => {
  console.log('form submitted', values, playData)
  // Save submitted data and enable the wheel
  submittedData.value = values
  submittedPlayData.value = playData ?? null
  formReady.value = true
}

const handleFormReady = (ready: boolean) => {
  // keep track of validation, but don't enable the wheel yet
  formValid.value = ready
}

const resetGameState = (): void => {
  submittedData.value = null
  submittedPlayData.value = null
  formReady.value = false
  formValid.value = false
  spinResult.value = null
}

const errorCatalog: Record<string, { title: string; message: string }> = {
  campaign_not_found: {
    title: 'Campaña no encontrada',
    message: 'Campaign not found or has no game configured.',
  },
  campaign_mismatch: {
    title: 'Código de campaña no coincide',
    message: 'The campaign does not match the provided code.',
  },
  missing_email: {
    title: 'Falta el correo electrónico',
    message: 'Email is required to participate.',
  },
  already_participated: {
    title: 'Ya participaste en esta campaña',
    message: 'Ya participaste en esta campaña.',
  },
  campaign_full: {
    title: 'Cupo lleno',
    message: 'Esta campaña ya alcanzó el número máximo de participantes.',
  },
  campaign_ended: {
    title: 'Campaña finalizada',
    message: 'Esta campaña ya finalizó.',
  },
}

const extractSubmissionError = (err: unknown): SubmissionErrorState => {
  if (axios.isAxiosError(err)) {
    const payload = err.response?.data as ApiErrorPayload | undefined
    const code = payload?.code
    const mapped = code ? errorCatalog[code] : null

    return {
      title: mapped?.title ?? 'No pudimos registrar tu participación',
      message: mapped?.message ?? payload?.message ?? err.message,
      code,
      status: payload?.status,
      httpStatus: err.response?.status,
    }
  }

  return {
    title: 'No pudimos registrar tu participación',
    message: 'Ocurrió un error al enviar tus datos. Intenta nuevamente.',
  }
}

const handleSubmissionError = (err: unknown): void => {
  const details = extractSubmissionError(err)
  console.error('Submission POST error:', err)
  submissionError.value = details
  isErrorModalOpen.value = true
  resetGameState()
}

const handleErrorModalChange = (open: boolean): void => {
  isErrorModalOpen.value = open
  if (!open) {
    submissionError.value = null
    reloadPage()
  }
}

const reloadPage = (): void => {
  window.location.reload()
}

const handleSuccessModalChange = (open: boolean): void => {
  isSuccessModalOpen.value = open
  if (!open) {
    reloadPage()
  }
}

const handleSpinFinished = async (payload: { prize?: string; segment?: any } | any) => {
  const prize = payload?.prize ?? (payload?.result ?? 'Premio desconocido')
  const segment = payload?.segment ?? null

  // Build final submission payload to send to backend
  const submission = {
    prize,
    segment,
    form: submittedData.value,
    playData: submittedPlayData.value,
    campaign_id: (campaign.value as any)?.id ?? null,
    timestamp: new Date().toISOString(),
  }

  // Save in state and log for inspection
  spinResult.value = { prize, formData: submittedData.value, segment, submission }
  console.log('Final submission prepared for backend:', submission)

  // Send to backend endpoint for this campaign code
  try {
    const url = `https://ruletaxpress.pro/api/campaigns/code/${encodeURIComponent(code.value)}/submissions`
    const resp = await axios.post(url, submission, { headers: { 'Content-Type': 'application/json' } })
    const message = resp?.data?.message ?? '¡Registro exitoso!'
    successMessage.value = message
    spinResult.value = { ...spinResult.value, serverResponse: resp.data }
    isSuccessModalOpen.value = true
  } catch (err) {
    handleSubmissionError(err)
  }

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
    class="max-w-[250px] h-auto rounded-lg shadow-md uppercase"
  />
  <div class="text-center md:text-left">
    <h2 :class="[companyNameClass, 'text-xl md:text-2xl font-semibold tracking-tight uppercase']">{{ campaign?.company_name }}</h2>
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
    <Dialog :open="isErrorModalOpen" @update:open="handleErrorModalChange">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader class="space-y-2">
          <DialogTitle class="text-xl font-semibold text-red-600 dark:text-red-400">
            {{ submissionError?.title ?? 'No pudimos registrar tu participación' }}
          </DialogTitle>
          <DialogDescription class="text-sm text-slate-600 dark:text-slate-200/80">
            {{ submissionError?.message ?? 'Ocurrió un error al enviar tus datos. Intenta nuevamente.' }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-2 text-sm text-slate-600 dark:text-slate-200/80">
          <p v-if="submissionError?.code" class="font-medium text-slate-800 dark:text-white">
            Código: <span class="font-normal">{{ submissionError.code }}</span>
          </p>
          <p v-if="submissionError?.httpStatus" class="font-medium text-slate-800 dark:text-white">
            Estado HTTP: <span class="font-normal">{{ submissionError.httpStatus }}</span>
          </p>
          <p class="leading-relaxed">Reiniciamos el formulario para que puedas intentarlo de nuevo.</p>
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="reloadPage">
            Cerrar
          </Button>
          <Button type="button" @click="reloadPage">
            Reintentar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog :open="isSuccessModalOpen" @update:open="handleSuccessModalChange">
      <DialogContent class="sm:max-w-lg overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-2xl">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_45%)] opacity-80 pointer-events-none" />
        <div class="relative space-y-4">
          <DialogHeader class="space-y-1 text-center">
            <DialogTitle class="text-3xl font-black drop-shadow-lg">¡Premio conseguido!</DialogTitle>
            <DialogDescription class="text-base text-white/90">
              Te enviaremos un correo con las instrucciones para reclamarlo.
            </DialogDescription>
          </DialogHeader>
          <div class="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur shadow-inner text-center">
            <p class="text-sm uppercase tracking-[0.35em] text-white/80">Tu premio</p>
            <p class="mt-2 text-3xl font-black leading-tight drop-shadow">
              {{ spinResult?.prize ?? 'Premio sorpresa' }}
            </p>
            <p v-if="successMessage" class="mt-2 text-sm text-white/85">{{ successMessage }}</p>
          </div>
          <DialogFooter class="flex justify-center">
            <Button type="button" class="bg-white text-orange-600 hover:bg-white/90" @click="handleSuccessModalChange(false)">
              ¡Listo!
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
