<script setup lang="ts">
import Winwheel from '@/types/Winwheel'
import type {
  WinwheelConstructor,
  WinwheelInstance,
  WinwheelOptions,
  WinwheelPins,
} from '@/types/winwheel-types'
// wheel-config types intentionally not imported here to avoid strict coupling
import type { CampaignData } from '@/types/campaign'
import { computed, defineProps, defineEmits, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { defaultWheelConfig } from '@/types/wheel-config'

const props = defineProps<{
  campaign: CampaignData | null
  title?: string
  loading?: boolean
  error?: string | null
  theme?: 'light' | 'dark'
  formReady?: boolean
  formData?: Record<string, string> | null
  fullLayout?: boolean
  campaignExpired?: boolean
}>()

const emit = defineEmits<{
  (e: 'finished', payload: { prize?: string; segment?: any } ): void
}>()

type PointerStyle = 'triangle' | 'arrow' | 'diamond' | 'kite' | 'shield' | 'tag' | 'chevron'
type PointerPosition =
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | 'top-left'
type ButtonPosition = 'center' | 'outside'


const canvasId = 'wheel-canvas'
const canvasRef = ref<HTMLCanvasElement | null>(null)
const wheel = ref<WinwheelInstance | null>(null)
const isSpinning = ref(false)

// UI / pointer / button defaults (fall back to campaign config when present)
const pointerPosition = ref<PointerPosition>('top')
const pointerStyle = ref<PointerStyle>('triangle')
const pointerColor = ref('#fbbf24')
const pointerOnButton = ref(false)
const buttonPosition = ref<ButtonPosition>('center')
const buttonSize = ref(130)
const pointerEl = ref<HTMLElement | null>(null)
const spinButtonRef = ref<HTMLButtonElement | null>(null)
const tickAudio = ref<HTMLAudioElement | null>(null)

const isReady = computed(() => Boolean(props.formReady) && !Boolean(props.campaignExpired))

const wheelPlacementStyle = computed(() => ({ justifySelf: 'center', alignSelf: 'center' }))

const pointerPlacement: Record<
  PointerPosition,
  { left: string; top: string; rot: string }
> = {
  top: { left: '50%', top: '-2%', rot: '0deg' },
  'top-right': { left: '90%', top: '8%', rot: '45deg' },
  right: { left: '101%', top: '50%', rot: '90deg' },
  'bottom-right': { left: '90%', top: '92%', rot: '135deg' },
  bottom: { left: '50%', top: '101%', rot: '180deg' },
  'bottom-left': { left: '10%', top: '92%', rot: '225deg' },
  left: { left: '-1%', top: '50%', rot: '270deg' },
  'top-left': { left: '10%', top: '8%', rot: '315deg' },
}

// audio options not required in this card component

const pointerVars = computed(() => {
  const pos = pointerPlacement[pointerPosition.value]
  return {
    '--pointer-left': pos.left,
    '--pointer-top': pos.top,
    '--pointer-rotate': pos.rot,
    '--pointer-color': pointerColor.value,
  }
})

const spinButtonStyle = computed(() => ({
  '--btn-size': `${buttonSize.value}px`,
  '--pointer-color': pointerColor.value,
}))

const spinButtonClasses = computed(() => ({
  'spin-button--outside': buttonPosition.value === 'outside',
  'spin-button--with-pointer': pointerOnButton.value,
  'spin-button--disabled': !isReady.value || isSpinning.value || Boolean(props.campaignExpired),
}))

const campaignConfig = computed(() => {
  return (props.campaign as any)?.campaign_game?.config ?? null
})

const campaignSegments = computed<any[]>(() => {
  const raw = campaignConfig.value?.segments
  if (!raw || !raw.length) {
    return defaultWheelConfig.segments
  }
  return raw.map((s: any, i: number) => ({
    // Preserve all backend-provided keys and normalize a few required ones for Winwheel
    ...s,
    fillStyle: s.fillStyle ?? defaultWheelConfig.segments[i % defaultWheelConfig.segments.length].fillStyle,
    strokeStyle: s.strokeStyle ?? '#111827',
    lineWidth: s.lineWidth ?? 1,
    text: s.text ?? s.label ?? s.coupon_code ?? `Premio ${i + 1}`,
  }))
})

const weightedSegments = computed(() => {
  const segments = campaignSegments.value
  if (!segments.length) return []

  return segments.map((segment: any, index: number) => {
    const rawProbability = Number((segment as any)?.probability)
    const baseWeight = Number.isFinite(rawProbability) && rawProbability > 0 ? rawProbability : 1
    const isLosing = Boolean((segment as any)?.losingSegment)
    const weight = isLosing ? Math.max(baseWeight * 0.01, 0.01) : baseWeight

    return {
      segment,
      weight,
      number: index + 1, // Winwheel segments are 1-indexed
    }
  })
})

const pickWeightedSegmentNumber = (): number | null => {
  if (!weightedSegments.value.length) return null
  const totalWeight = weightedSegments.value.reduce((sum, entry) => sum + entry.weight, 0)
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    return weightedSegments.value[weightedSegments.value.length - 1]?.number ?? null
  }

  const roll = Math.random() * totalWeight
  let acc = 0
  for (const entry of weightedSegments.value) {
    acc += entry.weight
    if (roll <= acc) {
      return entry.number
    }
  }

  return weightedSegments.value[weightedSegments.value.length - 1]?.number ?? null
}

const applyPointerAngle = () => {
  if (!wheel.value) return
  wheel.value.pointerAngle = (campaignConfig.value?.pointerAngle ?? 0) || 0
  wheel.value.draw()
}

const playTick = () => {
  if (!tickAudio.value) return
  try {
    tickAudio.value.pause()
    tickAudio.value.currentTime = 0
    void tickAudio.value.play()
  } catch {
    // ignore playback errors (autoplay restrictions, etc.)
  }
}

const buildWheel = () => {
  const cfg: any = campaignConfig.value
  if (!cfg) return

  const segments = campaignSegments.value

  if (wheel.value) {
    isSpinning.value = false
    try {
      wheel.value.stopAnimation(false)
    } catch {}
  }

  const pinsFromConfig: WinwheelPins | undefined = cfg.pins
    ? {
        number: cfg.pins.number,
        outerRadius: cfg.pins.outerRadius,
        margin: cfg.pins.margin,
        fillStyle: cfg.pins.fillStyle,
        strokeStyle: cfg.pins.strokeStyle,
        lineWidth: cfg.pins.lineWidth ?? 1,
      }
    : undefined

  const animation = cfg.animation || {}

  const options: WinwheelOptions = {
    canvasId: cfg.canvasId ?? canvasId,
    canvasElement: canvasRef.value ?? undefined,
    numSegments: segments.length,
    outerRadius: cfg.outerRadius ?? (defaultWheelConfig?.wheel?.outerRadius ?? 210),
    innerRadius: cfg.innerRadius ?? (defaultWheelConfig?.wheel?.innerRadius ?? 0),
    textFontSize: cfg.textFontSize ?? (defaultWheelConfig?.wheel?.textFontSize ?? 14),
    textAlignment: cfg.textAlignment ?? (defaultWheelConfig?.wheel?.textAlignment ?? 'outer'),
    textFillStyle: cfg.textFillStyle ?? (defaultWheelConfig?.wheel?.textFillStyle ?? '#111827'),
    strokeStyle: cfg.strokeStyle ?? (defaultWheelConfig?.wheel?.strokeStyle ?? '#111827'),
    lineWidth: cfg.lineWidth ?? (defaultWheelConfig?.wheel?.lineWidth ?? 1),
    animation: {
      type: animation.type ?? 'spinToStop',
      duration: animation.duration ?? 6,
      spins: animation.spins ?? 8,
      easing: animation.easing ?? 'Power4.easeOut',
      direction: animation.direction ?? undefined,
      stopAngle: animation.stopAngle ?? undefined,
      callbackSound: playTick,
      soundTrigger: animation.soundTrigger ?? 'pin',
      callbackFinished: () => {
        isSpinning.value = false

        // Try to determine the winning segment text and capture the full segment object
        let prize = 'Premio desconocido'
        let winningSegment: any = null
        try {
          const w: any = wheel.value
          // Winwheel exposes helpers like getIndicatedSegment() or getIndicatedSegmentNumber()
          const indicatedSegment = typeof w?.getIndicatedSegment === 'function' ? w.getIndicatedSegment() : undefined
          const indicatedNumber = typeof w?.getIndicatedSegmentNumber === 'function' ? w.getIndicatedSegmentNumber() : undefined

          if (indicatedSegment) {
            // Save and log full indicated segment for inspection
            winningSegment = indicatedSegment
            console.log('Winwheel indicatedSegment:', indicatedSegment)
            prize = indicatedSegment.text ?? indicatedSegment.label ?? prize
          } else if (typeof indicatedNumber === 'number' && Array.isArray(w?.segments)) {
            // segments might be 1-indexed in Winwheel
            const seg = w.segments[indicatedNumber] ?? w.segments[indicatedNumber - 1]
            winningSegment = seg
            // Log computed segment and full segments array for inspection
            console.log('Winwheel indicatedNumber:', indicatedNumber, 'computedSegment:', seg, 'allSegments:', w.segments)
            if (seg) prize = seg.text ?? seg.label ?? prize
          }
        } catch {
          // ignore and fallback to unknown prize
        }

        // Emit both prize and the full segment object so the parent can combine it with form data
        emit('finished', { prize, segment: winningSegment })
      },
    },
    segments,
    pins: pinsFromConfig ?? undefined,
    clearTheCanvas: cfg.clearTheCanvas ?? true,
  }

  const WinwheelCtor = Winwheel as unknown as WinwheelConstructor
  wheel.value = new WinwheelCtor(options)
  applyPointerAngle()
}

const handleSpin = () => {
  if (!isReady.value || isSpinning.value || !wheel.value) return

  const targetSegmentNumber = pickWeightedSegmentNumber()
  if (!targetSegmentNumber || !wheel.value.animation) return

  const winwheel = wheel.value as WinwheelInstance & { getRandomForSegment?: (segmentNumber: number) => number }
  const angleFromHelper =
    typeof winwheel.getRandomForSegment === 'function' ? winwheel.getRandomForSegment(targetSegmentNumber) : undefined

  let resolvedStopAngle = angleFromHelper

  if (typeof resolvedStopAngle !== 'number' || Number.isNaN(resolvedStopAngle)) {
    const segmentsCount = weightedSegments.value.length
    if (!segmentsCount) return
    const angleSize = 360 / segmentsCount
    const safePadding = 1
    const startAngle = angleSize * (targetSegmentNumber - 1)
    resolvedStopAngle = startAngle + safePadding + Math.random() * Math.max(angleSize - safePadding * 2, 0)
  }

  winwheel.animation.stopAngle = resolvedStopAngle

  isSpinning.value = true
  try {
    winwheel.startAnimation()
  } catch {
    isSpinning.value = false
  }
}

watch(
  () => props.campaign,
  () => {
    // update local UI values from campaign config when available
    const cfg = campaignConfig.value
    if (cfg) {
      pointerPosition.value = (cfg.pointer?.position as PointerPosition) ?? 'top'
      pointerColor.value = cfg.pointer?.color ?? pointerColor.value
      pointerOnButton.value = cfg.pointer?.integratedOnButton ?? false
      buttonPosition.value = (cfg.button?.position as ButtonPosition) ?? 'center'
      buttonSize.value = cfg.button?.size ?? buttonSize.value
    }
    buildWheel()
  },
  { immediate: true, deep: true },
)

watch(
  () => canvasRef.value,
  () => {
    buildWheel()
  },
)

onMounted(() => {
  tickAudio.value = new Audio('/sound/tick.mp3')
  buildWheel()
})

onBeforeUnmount(() => {
  if (wheel.value) {
    try {
      wheel.value.stopAnimation(false)
    } catch {}
  }
})



</script>
<template>
 <div class="wheel-wrapper" :style="wheelPlacementStyle">
      <div
        v-show="!pointerOnButton"
        ref="pointerEl"
        class="pointer"
        :class="pointerStyle"
        :style="pointerVars"
      />
      <canvas ref="canvasRef" :id="canvasId" width="420" height="420" class="wheel-canvas" />
      <button
        ref="spinButtonRef"
        type="button"
        class="spin-button"
        :class="spinButtonClasses"
        :style="spinButtonStyle"
        @click="handleSpin"
        :disabled="!isReady || isSpinning"
      >
        Girar
      </button>
    </div>
</template>

<style scoped>
.builder-grid {
  display: grid;
  grid-template-columns: 360px 1fr 340px;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  padding: 32px;
}

.panel {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  padding: 20px 20px 24px;
}

.panel-wide {
  grid-column: 1 / -1;
  max-width: 1220px;
  width: 100%;
  margin: 0 auto;
}

.panel h1 {
  margin: 0;
}

.panel .note {
  font-size: 13px;
  color: #c4d0e1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 12px;
  padding: 12px;
  line-height: 1.5;
}

.wheel-wrapper {
  position: relative;
  width: 480px;
  height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wheel-canvas {
  border-radius: 50%;
  box-shadow:
    0 0 0 10px rgba(148, 163, 184, 0.5),
    0 28px 72px rgba(0, 0, 0, 0.9);
  background: radial-gradient(circle, #020617 0%, #0b1120 60%, #020617 100%);
}

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

.spin-button {
  position: absolute;
  width: var(--btn-size, 130px);
  height: var(--btn-size, 130px);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: radial-gradient(circle, #facc15, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow:
    0 0 0 4px rgba(15, 23, 42, 0.9),
    0 24px 48px rgba(0, 0, 0, 0.9);
  text-transform: uppercase;
  user-select: none;
  transition: transform 0.1s ease, box-shadow 0.1s ease, top 0.2s ease, left 0.2s ease;
  --pointer-color: #fbbf24;
  border: none;
}

.spin-button--with-pointer::after {
  content: '';
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 18px solid var(--pointer-color);
  filter: drop-shadow(0 6px 6px rgba(15, 23, 42, 0.45));
}

.spin-button--outside {
  top: 108%;
  left: 50%;
  transform: translate(-50%, 0);
  width: 170px;
  height: 54px;
  border-radius: 12px;
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.45),
    0 0 0 2px rgba(15, 23, 42, 0.9);
}

.spin-button:active {
  transform: translate(-50%, -50%) scale(0.98);
  box-shadow:
    0 0 0 2px rgba(15, 23, 42, 1),
    0 14px 26px rgba(0, 0, 0, 0.8);
}

.spin-button[disabled],
.spin-button--disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

@media (max-width: 980px) {
  .builder-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    justify-items: center;
    padding: 20px;
  }

  .panel {
    width: 100%;
    max-width: 520px;
  }

  .wheel-wrapper {
    order: 2;
  }

  #segmentBuilder {
    order: 3;
    width: 100%;
    max-width: 520px;
  }

  .panel-wide {
    grid-column: 1;
    width: 100%;
  }
}
</style>
