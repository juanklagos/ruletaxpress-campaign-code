<script setup lang="ts">
import axios from 'axios'
import { Head } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import WheelCard from '@/components/WheelCard.vue'
import GameForm from '@/components/GameForm.vue'
import type { WinwheelSegment } from '@/types/winwheel-types'
import { defaultWheelConfig, type WheelConfig } from '@/types/wheel-config'

type FormField = {
  type: string
  data: {
    label?: string
    key: string
    placeholder?: string
    required?: boolean
    helper?: string
  }
}

type CampaignGame = {
  name: string
  config: {
    form_theme?: string
    cta_button?: {
      label?: string
    }
    form?: Record<string, FormField>
    segments?: Array<{
      fillStyle?: string
      text?: string
      strokeStyle?: string
      lineWidth?: number
      label?: string
      cupon?: string
    }>
    animation?: Record<string, number | string>
    outerRadius?: number
    innerRadius?: number
    pointerAngle?: number
    pointer?: {
      position?: WheelConfig['pointer']['position']
      color?: string
    }
    lineWidth?: number
    strokeStyle?: string
  }
}

type CampaignData = {
  code: string
  campaign_game: CampaignGame | null
}

type CampaignApiResponse = {
  status: 'success' | 'error'
  data: CampaignData | null
  message?: string
}

const props = defineProps<{ code: string }>()

const code = ref(props.code)
const loading = ref(true)
const error = ref<string | null>(null)
const campaign = ref<CampaignData | null>(null)
const submitting = ref(false)
const formMessage = ref<string | null>(null)

const formFields = computed(() => {
  const form = campaign.value?.campaign_game?.config.form
  if (!form) {
    return []
  }

  return Object.entries(form).map(([key, field]) => ({
    key,
    label: field.data.label ?? field.data.key ?? 'Campo sin nombre',
    type: field.data.type ?? field.type,
    placeholder: field.data.placeholder,
    required: Boolean(field.data.required),
    helper: field.data.helper,
  }))
})

const ctaButtonLabel = computed(() => campaign.value?.campaign_game?.config.cta_button?.label ?? 'Spin it')

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

const wheelConfig = computed<WheelConfig>(() => {
  const config = campaign.value?.campaign_game?.config
  const segments = (config?.segments && config.segments.length
    ? config.segments.map((segment, index) => ({
        fillStyle:
          segment.fillStyle ??
          defaultWheelConfig.segments[index % defaultWheelConfig.segments.length].fillStyle,
        strokeStyle: segment.strokeStyle ?? '#111827',
        lineWidth: segment.lineWidth ?? 2,
        text: segment.text ?? segment.label ?? segment.cupon ?? `Premio ${index + 1}`,
      }))
    : defaultWheelConfig.segments) as WinwheelSegment[]

  return {
    ...defaultWheelConfig,
    wheel: {
      ...defaultWheelConfig.wheel,
      outerRadius: config?.outerRadius ?? defaultWheelConfig.wheel.outerRadius,
      innerRadius: config?.innerRadius ?? defaultWheelConfig.wheel.innerRadius,
      strokeStyle: config?.strokeStyle ?? defaultWheelConfig.wheel.strokeStyle,
      lineWidth: config?.lineWidth ?? defaultWheelConfig.wheel.lineWidth,
      animation: {
        ...defaultWheelConfig.wheel.animation,
        ...(config?.animation ?? {}),
      },
      pointerAngle: config?.pointerAngle ?? defaultWheelConfig.wheel.pointerAngle,
    },
    segments,
    pointer: {
      color: config?.pointer?.color ?? defaultWheelConfig.pointer?.color,
      position: config?.pointer?.position ?? defaultWheelConfig.pointer?.position,
    },
    button: defaultWheelConfig.button,
    layout: defaultWheelConfig.layout,
    audio: defaultWheelConfig.audio,
  }
})

const handleFormSubmit = async (): Promise<void> => {
  if (!formFields.value.length) {
    formMessage.value = 'No hay campos configurados para este juego.'
    return
  }

  submitting.value = true
  formMessage.value = null
  await new Promise((resolve) => window.setTimeout(resolve, 600))
  formMessage.value = '¡Todo listo para registrar tu participación!'
  submitting.value = false
}

const fetchCampaign = async (): Promise<void> => {
  loading.value = true
  error.value = null
  campaign.value = null

  try {
    const response = await axios.get<CampaignApiResponse>(
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

  <div :class="[outerThemeClass, 'flex min-h-screen items-center justify-center px-4 py-10']">
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
              :config="wheelConfig"
              :title="campaign?.campaign_game?.name"
              :loading="loading"
              :error="error"
              :theme="normalizedTheme"
            />
          </div>
          <div class="flex-1">
            <GameForm
              :fields="formFields"
              :cta-label="ctaButtonLabel"
              :theme="normalizedTheme"
              :loading="loading && !campaign"
              :submitting="submitting"
              :message="formMessage"
              @submit="handleFormSubmit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
