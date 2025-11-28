<script setup lang="ts">
import Winwheel from '@/types/Winwheel'
import type {
  WinwheelAnimation,
  WinwheelConstructor,
  WinwheelInstance,
  WinwheelOptions,
  WinwheelPins,
  WinwheelSegment,
} from '@/types/winwheel-types'
import type { WheelConfig } from '@/types/wheel-config'
import type { CampaignData } from '@/types/campaign'
import { computed, defineProps, onMounted, ref, watch } from 'vue'
import { defaultWheelConfig } from '@/types/wheel-config'

const props = defineProps<{
  campaign: CampaignData | null
  title?: string
  loading?: boolean
  error?: string | null
  theme?: 'light' | 'dark'
  formReady?: boolean
}>()

const pointerPlacement: Record<string, { left: string; top: string; rot: string }> = {
  top: { left: '50%', top: '-1%', rot: '0deg' },
  'top-right': { left: '90%', top: '6%', rot: '45deg' },
  right: { left: '101%', top: '50%', rot: '90deg' },
  'bottom-right': { left: '90%', top: '90%', rot: '135deg' },
  bottom: { left: '50%', top: '101%', rot: '180deg' },
  'bottom-left': { left: '10%', top: '90%', rot: '225deg' },
  left: { left: '-1%', top: '50%', rot: '270deg' },
  'top-left': { left: '10%', top: '6%', rot: '315deg' },
}

const pointerAngles: Record<string, number> = {
  top: 0,
  'top-right': 45,
  right: 90,
  'bottom-right': 135,
  bottom: 180,
  'bottom-left': 225,
  left: 270,
  'top-left': 315,
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const wheelInstance = ref<WinwheelInstance | null>(null)
const isSpinning = ref(false)

const campaignSegments = computed<WinwheelSegment[]>(() => {
  const raw = props.campaign?.campaign_game?.config.segments
  if (!raw?.length) {
    return defaultWheelConfig.segments
  }

  return raw.map((segment, index) => ({
    fillStyle:
      segment.fillStyle ?? defaultWheelConfig.segments[index % defaultWheelConfig.segments.length].fillStyle,
    strokeStyle: segment.strokeStyle ?? '#111827',
    lineWidth: segment.lineWidth ?? 2,
    text: segment.text ?? segment.label ?? segment.cupon ?? `Premio ${index + 1}`,
  }))
})

const campaignConfig = computed<WheelConfig>(() => {
  const config = props.campaign?.campaign_game?.config
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
    segments: campaignSegments.value,
    pointer: {
      color: config?.pointer?.color ?? defaultWheelConfig.pointer?.color,
      position: config?.pointer?.position ?? defaultWheelConfig.pointer?.position,
    },
    button: defaultWheelConfig.button,
    layout: defaultWheelConfig.layout,
    audio: defaultWheelConfig.audio,
  }
})

const pointerColor = computed(() => campaignConfig.value.pointer?.color ?? '#fbbf24')

const currentPointer = computed(() => ({
  integratedOnButton: campaignConfig.value.pointer?.integratedOnButton ?? false,
  position: campaignConfig.value.pointer?.position ?? 'top',
}))

const pointerStyle = computed(() => {
  const placement = pointerPlacement[currentPointer.value.position || 'top'] ?? pointerPlacement.top
  return {
    left: placement.left,
    top: placement.top,
    transform: `translate(-50%, -50%) rotate(${placement.rot})`,
    background: pointerColor.value,
  }
})

const spinButtonStyle = computed(() => {
  const baseSize = campaignConfig.value.button?.size ?? 140
  if (campaignConfig.value.button?.position === 'outside') {
    return {
      width: `${baseSize + 40}px`,
      height: '56px',
      top: '108%',
      left: '50%',
      transform: 'translate(-50%, 0)',
    }
  }

  return {
    width: `${baseSize}px`,
    height: `${baseSize}px`,
  }
})

const spinButtonClass = computed(() => {
  const base =
    'absolute grid place-items-center bg-[radial-gradient(circle,#facc15,#f97316)] text-slate-900 font-extrabold uppercase tracking-[0.06em] text-lg shadow-[0_0_0_4px_rgba(15,23,42,0.9),0_24px_48px_rgba(0,0,0,0.9)] transition duration-100 ease-linear select-none border-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed'
  const inside =
    'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full hover:scale-[1.015]'
  const outside =
    'top-[108%] left-1/2 -translate-x-1/2 transform rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.45),0_0_0_2px_rgba(15,23,42,0.9)] text-base'

  return `${base} ${
    campaignConfig.value.button?.position === 'outside' ? outside : inside
  }`
})

const animationOptions = computed<WinwheelAnimation>(() => {
  const animation = campaignConfig.value.wheel.animation
  const opts: WinwheelAnimation = {
    type: animation?.type ?? 'spinToStop',
    duration: animation?.duration ?? 6,
    spins: animation?.spins ?? 8,
    easing: animation?.easing ?? 'Power4.easeOut',
    callbackFinished: () => {
      isSpinning.value = false
    },
  }

  if (animation?.direction) {
    opts.direction = animation.direction as string
  }

  return opts
})

const buildWheel = () => {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }

  wheelInstance.value?.stopAnimation(true)

  const pins: WinwheelPins | null =
    campaignConfig.value.audio?.pins && campaignConfig.value.audio.pins > 0
      ? {
          number: campaignConfig.value.audio.pins,
          outerRadius: 5,
          margin: 8,
          fillStyle: '#f8fafc',
          strokeStyle: '#0f172a',
          lineWidth: 1,
        }
      : null

  const options: WinwheelOptions = {
    canvasId: 'wheelCanvas',
    canvasElement: canvas,
    numSegments: campaignConfig.value.segments.length,
    outerRadius: campaignConfig.value.wheel.outerRadius ?? 240,
    innerRadius: campaignConfig.value.wheel.innerRadius ?? 60,
    textFontSize: campaignConfig.value.wheel.textFontSize ?? 16,
    textAlignment: campaignConfig.value.wheel.textAlignment ?? 'outer',
    textFillStyle: campaignConfig.value.wheel.textFillStyle ?? '#0f172a',
    strokeStyle: campaignConfig.value.wheel.strokeStyle ?? '#111827',
    lineWidth: campaignConfig.value.wheel.lineWidth ?? 2,
    animation: animationOptions.value,
    segments: campaignConfig.value.segments,
    pins: pins ?? undefined,
    clearTheCanvas: campaignConfig.value.wheel.clearTheCanvas ?? true,
  }

  const WinwheelCtor = Winwheel as unknown as WinwheelConstructor
  wheelInstance.value = new WinwheelCtor(options)
  wheelInstance.value.pointerAngle =
    campaignConfig.value.wheel.pointerAngle ??
    pointerAngles[campaignConfig.value.pointer?.position || 'top'] ??
    0
  wheelInstance.value.draw()
}

const isReady = computed(() => !!props.formReady)

const handleSpin = () => {
  if (!isReady.value || isSpinning.value || !wheelInstance.value) {
    return
  }

  isSpinning.value = true
  wheelInstance.value.startAnimation()
}

watch(
  () => props.campaign,
  () => {
    buildWheel()
  },
  { deep: true, flush: 'post' },
)

watch(
  () => canvasRef.value,
  () => {
    buildWheel()
  },
)

onMounted(() => {
  buildWheel()
})
</script>

<template>
  <div class="grid w-full justify-items-center gap-3 lg:justify-items-start">
    <div
      class="relative mx-auto flex aspect-square min-h-[320px] w-full max-w-[520px] items-center justify-center lg:min-h-0"
      :style="{ justifySelf: 'center', alignSelf: 'center' }"
    >
      <div
        v-if="props.title"
        class="absolute top-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70"
      >
        {{ props.title }}
      </div>
      <div
        v-show="!currentPointer.integratedOnButton"
        class="absolute h-8 w-9 origin-center rounded-[4px] drop-shadow-[0_8px_8px_rgba(15,23,42,0.8)] transition-all duration-200"
        :style="pointerStyle"
      />
      <canvas
        ref="canvasRef"
        id="wheelCanvas"
        width="520"
        height="520"
        class="h-full w-full max-w-full rounded-full bg-[radial-gradient(circle,#020617_0%,#0b1120_60%,#020617_100%)] shadow-[0_0_0_6px_rgba(148,163,184,0.45),0_20px_60px_rgba(0,0,0,0.8)]"
      />
      <button
        type="button"
        class="cursor-pointer"
        :class="spinButtonClass"
        :style="spinButtonStyle"
        :disabled="isSpinning || !isReady"
        @click="handleSpin"
      >
        <span
        v-if="currentPointer.integratedOnButton"
          class="absolute -top-4 left-1/2 block h-5 w-6 -translate-x-1/2 drop-shadow-[0_6px_6px_rgba(15,23,42,0.45)] transition-all duration-200"
          :style="{ clipPath: 'polygon(50% 100%, 100% 0, 0 0)', background: pointerColor }"
        />
        {{ isSpinning ? 'Girando' : 'Girar' }}
      </button>
      <div
        v-if="props.loading"
        :class="[
          'absolute inset-0 grid place-items-center rounded-full text-xs font-semibold uppercase tracking-[0.5em]',
          props.theme === 'light' ? 'bg-white/70 text-slate-800' : 'bg-black/50 text-white/70',
        ]"
      >
        Cargando configuración…
      </div>
      <div
        v-else-if="props.error"
        :class="[
          'absolute inset-0 grid place-items-center rounded-full text-xs font-semibold uppercase tracking-[0.4em]',
          props.theme === 'light' ? 'bg-white/85 text-red-600' : 'bg-black/60 text-red-200',
        ]"
      >
        {{ props.error }}
      </div>
      <div
        v-if="!isReady"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white"
      >
        Completa el formulario para girar
      </div>
    </div>
  </div>
</template>

<style scoped>

.pointer {
  position: absolute;
  left: var(--pointer-left, 50%);
  top: var(--pointer-top, -2%);
  transform: translate(-50%, -50%) rotate(var(--pointer-rotate, 0deg));
  filter: drop-shadow(0 8px 8px rgba(15, 23, 42, 0.8));
  --pointer-color: #fbbf24;
  transition: transform 0.2s ease, left 0.2s ease, top 0.2s ease;
}

.pointer.triangle {
  width: 36px;
  height: 32px;
  background: var(--pointer-color);
  clip-path: polygon(50% 100%, 100% 0, 0 0);
}

.pointer.arrow {
  width: 44px;
  height: 46px;
  background: var(--pointer-color);
  clip-path: polygon(50% 100%, 100% 40%, 70% 40%, 70% 0, 30% 0, 30% 40%, 0 40%);
  border: none;
}

.pointer.diamond {
  width: 30px;
  height: 30px;
  background: var(--pointer-color);
  transform: translate(-50%, -50%) rotate(calc(45deg + var(--pointer-rotate, 0deg)));
  border-radius: 4px;
  top: var(--pointer-top, -2%);
  left: var(--pointer-left, 50%);
}

.pointer.kite {
  width: 44px;
  height: 52px;
  background: var(--pointer-color);
  clip-path: polygon(50% 100%, 85% 50%, 50% 0, 15% 50%);
}

.pointer.shield {
  width: 46px;
  height: 52px;
  background: var(--pointer-color);
  clip-path: polygon(50% 100%, 100% 75%, 80% 0, 20% 0, 0 75%);
}

.pointer.tag {
  width: 46px;
  height: 52px;
  background: var(--pointer-color);
  clip-path: polygon(0 30%, 40% 30%, 40% 0, 60% 0, 60% 30%, 100% 30%, 100% 100%, 0 100%);
}

.pointer.chevron {
  width: 44px;
  height: 52px;
  background: var(--pointer-color);
  clip-path: polygon(50% 100%, 100% 62%, 70% 62%, 70% 0, 30% 0, 30% 62%, 0 62%);
}
</style>
