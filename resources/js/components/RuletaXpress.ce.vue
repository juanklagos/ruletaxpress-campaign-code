<script setup lang="ts">
import {
  Dialog,
  DialogOverlay,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Winwheel from '@/lib/Winwheel'
import type {
  WinwheelAnimation,
  WinwheelConstructor,
  WinwheelInstance,
  WinwheelOptions,
  WinwheelPins,
  WinwheelSegment,
} from '@/types/winwheel-types'

interface WheelConfig {
  templateKey?: string
  wheel: Partial<WinwheelOptions> & { pointerAngle?: number }
  segments: WinwheelSegment[]
  pointer?: {
    style?: string
    color?: string
    position?: string
    integratedOnButton?: boolean
  }
  button?: {
    size?: number
    position?: 'center' | 'outside'
  }
  audio?: {
    key?: string | null
    soundTrigger?: 'pin' | 'segment'
    pins?: number | null
  }
  layout?: {
    wheelPosition?: 'center' | 'left' | 'right' | 'top' | 'bottom'
  }
}

interface Props {
  code?: string
  data: string
  floatSide?: 'left' | 'right'
  floatVertical?: 'middle' | 'top' | 'bottom'
  theme?: 'light' | 'dark'
}

const props = defineProps<Props>()

const canvasId = 'rx-wheel-canvas'
const canvasRef = ref<HTMLCanvasElement | null>(null)
const wheel = ref<WinwheelInstance | null>(null)
const isSpinning = ref(false)
const isModalOpen = ref(false)

const parsedConfig = computed<WheelConfig | null>(() => {
  try {
    return JSON.parse(props.data) as WheelConfig
  } catch (error) {
    console.error('Invalid JSON received in `data` prop', error)
    return null
  }
})

const fallbackConfig: WheelConfig = {
  templateKey: 'vibrante',
  wheel: {
    outerRadius: 240,
    innerRadius: 60,
    textAlignment: 'outer',
    textFillStyle: '#0f172a',
    textFontSize: 16,
    textMargin: 18,
    strokeStyle: '#0f172a',
    lineWidth: 1,
    animation: { duration: 6, spins: 8, easing: 'Power4.easeOut' },
    pointerAngle: 0,
  },
  segments: [
    { fillStyle: '#f97316', text: 'Premio 1' },
    { fillStyle: '#facc15', text: 'Premio 2' },
    { fillStyle: '#22c55e', text: 'Premio 3' },
    { fillStyle: '#2dd4bf', text: 'Premio 4' },
    { fillStyle: '#38bdf8', text: 'Premio 5' },
    { fillStyle: '#6366f1', text: 'Premio 6' },
    { fillStyle: '#ec4899', text: 'Premio 7' },
    { fillStyle: '#f97316', text: 'Premio 8' },
  ],
  pointer: { style: 'triangle', color: '#fbbf24', position: 'top', integratedOnButton: false },
  button: { size: 130, position: 'center' },
  layout: { wheelPosition: 'center' },
  audio: { key: 'tick', soundTrigger: 'pin', pins: 32 },
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

const wheelPlacement = {
  center: { justifySelf: 'center', alignSelf: 'center' },
  left: { justifySelf: 'start', alignSelf: 'center' },
  right: { justifySelf: 'end', alignSelf: 'center' },
  top: { justifySelf: 'center', alignSelf: 'start' },
  bottom: { justifySelf: 'center', alignSelf: 'end' },
}

const currentConfig = computed(() => parsedConfig.value ?? fallbackConfig)

const pointerColor = computed(() => currentConfig.value.pointer?.color || '#fbbf24')

const pointerStyle = computed(() => {
  const pos =
    pointerPlacement[currentConfig.value.pointer?.position || 'top'] || pointerPlacement.top
  return {
    left: pos?.left || '50%',
    top: pos?.top || '-2%',
    transform: `translate(-50%, -50%) rotate(${pos?.rot || '0deg'})`,
    background: pointerColor.value,
    clipPath: 'polygon(50% 100%, 100% 0, 0 0)',
  }
})

const spinButtonStyle = computed(() => {
  const baseSize = currentConfig.value.button?.size || 130
  if (currentConfig.value.button?.position === 'outside') {
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
  return `${base} ${currentConfig.value.button?.position === 'outside' ? outside : inside}`
})

const wheelPlacementStyle = computed(
  () => wheelPlacement[currentConfig.value.layout?.wheelPosition || 'center'],
)

const audioNodes: Record<string, HTMLAudioElement> = {}
const currentAudioNode = ref<HTMLAudioElement | null>(null)

const createAudio = (files: string[]) => {
  const node = new Audio()
  node.preload = 'auto'
  let idx = 0
  const tryNext = () => {
    const nextFile = files[idx]
    if (!nextFile) return
    node.src = nextFile
    idx += 1
    node.load()
  }
  node.addEventListener('error', () => tryNext())
  tryNext()
  return node
}

const getAudioNode = (key: string | null | undefined, files: string[]) => {
  if (!key || !files.length) return null
  if (!audioNodes[key]) {
    audioNodes[key] = createAudio(files)
  }
  return audioNodes[key]
}

const playTick = () => {
  if (!currentAudioNode.value) return
  const a = currentAudioNode.value.cloneNode(true) as HTMLAudioElement
  a.currentTime = 0
  void a.play().catch(() => {})
}

const applyPointerAngle = () => {
  if (!wheel.value) return
  const angle = pointerAngles[currentConfig.value.pointer?.position || 'top'] ?? 0
  wheel.value.pointerAngle = angle
  wheel.value.draw()
}

const buildWheel = () => {
  const canvasEl = canvasRef.value
  if (!canvasEl) return

  const cfg = currentConfig.value
  const baseWheel = cfg.wheel || {}

  const pinsFromAudio =
    cfg.audio?.pins && cfg.audio.pins > 0
      ? ({
          number: cfg.audio.pins,
          outerRadius: 5,
          margin: 8,
          fillStyle: '#f8fafc',
          strokeStyle: '#0f172a',
          lineWidth: 1,
        } satisfies WinwheelPins)
      : baseWheel.pins

  const animation: WinwheelAnimation = {
    type: baseWheel.animation?.type || 'spinToStop',
    duration: baseWheel.animation?.duration || 6,
    spins: baseWheel.animation?.spins || 8,
    easing: baseWheel.animation?.easing || 'Power4.easeOut',
    direction: baseWheel.animation?.direction,
    stopAngle: baseWheel.animation?.stopAngle,
    repeat: baseWheel.animation?.repeat,
    callbackFinished: handleFinish,
    callbackSound: currentAudioNode.value ? playTick : null,
    soundTrigger: cfg.audio?.soundTrigger || baseWheel.animation?.soundTrigger,
  }

  const wheelOptions: WinwheelOptions = {
    canvasId,
    canvas: canvasEl,
    numSegments: cfg.segments.length,
    outerRadius: baseWheel.outerRadius ?? 240,
    innerRadius: cfg.button?.position === 'outside' ? 0 : baseWheel.innerRadius ?? 0,
    textFontSize: baseWheel.textFontSize ?? 16,
    textAlignment: baseWheel.textAlignment || 'outer',
    textMargin: baseWheel.textMargin ?? 0,
    textFillStyle: baseWheel.textFillStyle || '#0f172a',
    textFontFamily: baseWheel.textFontFamily,
    textFontWeight: baseWheel.textFontWeight,
    textOrientation: baseWheel.textOrientation,
    textDirection: baseWheel.textDirection,
    textStrokeStyle: baseWheel.textStrokeStyle,
    textLineWidth: baseWheel.textLineWidth,
    strokeStyle: baseWheel.strokeStyle || '#0f172a',
    lineWidth: baseWheel.lineWidth,
    drawMode: baseWheel.drawMode,
    rotationAngle: baseWheel.rotationAngle,
    clearTheCanvas: baseWheel.clearTheCanvas,
    segments: cfg.segments,
    pins: pinsFromAudio ?? null,
    animation,
  }

  const WinwheelCtor = Winwheel as unknown as WinwheelConstructor
  wheel.value = new WinwheelCtor(wheelOptions)
  const pointerAngle = cfg.wheel.pointerAngle ?? pointerAngles[cfg.pointer?.position || 'top'] ?? 0
  wheel.value.pointerAngle = pointerAngle
  wheel.value.draw()
}

const handleSpin = () => {
  if (isSpinning.value || !wheel.value) return
  isSpinning.value = true
  wheel.value.startAnimation()
}

const handleFinish = (segment: WinwheelSegment) => {
  isSpinning.value = false
  const event = new CustomEvent('rx-spin-finished', { detail: { segment } })
  window.dispatchEvent(event)
}

watch(
  () => currentConfig.value,
  () => {
    const audioKey = currentConfig.value.audio?.key
    const files =
      !audioKey || audioKey === 'mute'
        ? []
        : [`sound/${audioKey}.wav`, `sound/${audioKey}.mp3`]
    currentAudioNode.value = getAudioNode(audioKey ?? null, files)
    buildWheel()
  },
  { deep: true },
)

onMounted(() => {
  const audioKey = currentConfig.value.audio?.key
  const files =
    !audioKey || audioKey === 'mute' ? [] : [`sound/${audioKey}.wav`, `sound/${audioKey}.mp3`]
  currentAudioNode.value = getAudioNode(audioKey ?? null, files)
  buildWheel()
  applyPointerAngle()
})

onBeforeUnmount(() => {
  if (wheel.value) {
    try {
      wheel.value.stopAnimation(false)
    } catch {
      // ignore
    }
  }
})

const floatButtonStyle = computed(() => {
  const side = props.floatSide === 'left' ? 'left' : 'right'
  const vertical = props.floatVertical ?? 'middle'
  return {
    position: 'fixed',
    [side]: '16px',
    top: vertical === 'middle' ? '50%' : vertical === 'top' ? '18%' : undefined,
    bottom: vertical === 'bottom' ? '18%' : undefined,
    transform: vertical === 'middle' ? 'translateY(-50%)' : undefined,
    zIndex: 40,
  } as Record<string, string | number>
})

const panelStyle = computed(() => ({
  transformOrigin: props.floatSide === 'left' ? '20% 50%' : '80% 50%',
}))

const theme = computed(() => (props.theme === 'dark' ? 'dark' : 'light'))

const themeTokens = computed(() =>
  theme.value === 'dark'
    ? {
        overlay: 'bg-slate-900/80',
        panel:
          'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 border border-white/10 shadow-2xl',
        closeBtn: 'border border-white/10 bg-white/10 text-slate-100 hover:bg-white/20',
        mutedText: 'text-slate-300',
        labelText: 'text-slate-200',
        input:
          'w-full rounded-xl border border-white/30 bg-white/10 text-slate-50 placeholder:text-slate-400/80 p-3 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:border-amber-300/80 transition',
        title: 'text-amber-300',
        footerText: 'text-slate-400',
      }
    : {
        overlay: 'bg-slate-900/30',
        panel:
          'bg-gradient-to-br from-white via-slate-50 to-white text-slate-900 border border-slate-200 shadow-xl',
        closeBtn: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
        mutedText: 'text-slate-600',
        labelText: 'text-slate-700',
        input:
          'w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 transition',
        title: 'text-amber-500',
        footerText: 'text-slate-500',
      },
)

const panelEnterFrom = computed(() =>
  props.floatSide === 'left'
    ? 'opacity-0 translate-x-[-16px] translate-y-[12px] scale-[0.94]'
    : 'opacity-0 translate-x-[16px] translate-y-[12px] scale-[0.94]',
)

const panelEnter = 'ease-out duration-[250ms]'
const panelEnterTo = 'opacity-100 translate-x-0 translate-y-0 scale-100'
const panelLeave = 'ease-in duration-[180ms]'
const panelLeaveFrom = panelEnterTo
const panelLeaveTo = 'opacity-0 translate-y-[12px] scale-[0.96]'

const openModal = () => {
  isModalOpen.value = true
  // redraw to ensure canvas sized
  setTimeout(() => {
    buildWheel()
    applyPointerAngle()
  }, 0)
}

const closeModal = () => {
  isModalOpen.value = false
}

</script>

<template>
  <button
    v-show="!isModalOpen"
    :style="floatButtonStyle"
    class="relative grid place-items-center h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-0 shadow-[0_14px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_18px_38px_rgba(0,0,0,0.4)] transition duration-150 ease-out hover:scale-105 active:scale-100 bg-[conic-gradient(#f97316,#facc15,#22c55e,#38bdf8,#ec4899,#f97316)] text-white cursor-pointer"
    @mousedown.stop
    @touchstart.stop
    @click="openModal"
  >
    <span class="grid place-items-center h-12 w-12 md:h-14 md:w-14 rounded-full bg-slate-900/85 text-[11px] md:text-xs font-extrabold tracking-[0.06em] uppercase">
      Ruleta
    </span>
  </button>

  <TransitionRoot appear :show="isModalOpen" as="template">
    <Dialog as="div" class="relative z-[80]" :open="isModalOpen" @close="closeModal">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <DialogOverlay class="fixed inset-0 z-[70]" :class="themeTokens.overlay" />
      </TransitionChild>

      <div class="fixed inset-0 grid place-items-center z-[80] p-4">
        <TransitionChild
          as="template"
          :enter="panelEnter"
          :enter-from="panelEnterFrom"
          :enter-to="panelEnterTo"
          :leave="panelLeave"
          :leave-from="panelLeaveFrom"
          :leave-to="panelLeaveTo"
        >
          <DialogPanel
            :style="panelStyle"
            class="relative p-5 sm:p-6 md:p-7 rounded-2xl w-[min(960px,92vw)] max-h-[90vh] grid gap-4 lg:grid-cols-2 place-items-center overflow-hidden"
            :class="themeTokens.panel"
          >
            <button
              type="button"
              class="absolute top-3 right-3 grid place-items-center h-9 w-9 rounded-full transition"
              :class="themeTokens.closeBtn"
              @click="closeModal"
            >
              ✕
            </button>
            <div class="w-full grid gap-3 justify-items-center lg:justify-items-start">
              <div
                class="relative w-full max-w-[520px] aspect-square min-h-[320px] lg:min-h-0 flex items-center justify-center mx-auto"
                :style="wheelPlacementStyle"
              >
                <div
                  v-show="!currentConfig.pointer?.integratedOnButton"
                  class="absolute w-9 h-8 rounded-[4px] origin-center drop-shadow-[0_8px_8px_rgba(15,23,42,0.8)] transition-all duration-200"
                  :style="pointerStyle"
                />
                <canvas
                  ref="canvasRef"
                  :id="canvasId"
                  width="520"
                  height="520"
                  class="w-full h-full max-w-full rounded-full shadow-[0_0_0_6px_rgba(148,163,184,0.45),0_20px_60px_rgba(0,0,0,0.8)] bg-[radial-gradient(circle,#020617_0%,#0b1120_60%,#020617_100%)]"
                />
                <button
                  type="button"
                  class="cursor-pointer"
                  :class="spinButtonClass"
                  :style="spinButtonStyle"
                  :disabled="isSpinning"
                  @click="handleSpin"
                >
                  <span
                    v-if="currentConfig.pointer?.integratedOnButton"
                    class="absolute -top-4 left-1/2 -translate-x-1/2 block w-6 h-5 drop-shadow-[0_6px_6px_rgba(15,23,42,0.45)] transition-all duration-200"
                    :style="{
                      clipPath: 'polygon(50% 100%, 100% 0, 0 0)',
                      background: pointerColor,
                    }"
                  />
                  {{ isSpinning ? 'Girando' : 'Girar' }}
                </button>
              </div>
            </div>
            <div class="w-full grid gap-3 text-center lg:text-left justify-items-center lg:justify-items-start">
              <DialogTitle class="text-2xl md:text-3xl font-extrabold" :class="themeTokens.title">
                Gana premios al instante
              </DialogTitle>
              <p :class="themeTokens.mutedText">
                Ingresa tus datos para girar la ruleta y reclamar recompensas.
              </p>
              <form class="grid gap-3 w-full max-w-md">
                <label class="grid gap-2 text-sm" :class="themeTokens.labelText">
                  <span>Correo electrónico</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    :class="themeTokens.input"
                  />
                </label>
                <label class="grid gap-2 text-sm" :class="themeTokens.labelText">
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Tu nombre"
                    :class="themeTokens.input"
                  />
                </label>
                <label class="grid gap-2 text-sm" :class="themeTokens.labelText">
                  <span>Teléfono</span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+57 300 000 0000"
                    :class="themeTokens.input"
                  />
                </label>
                <button
                  type="button"
                  class="mt-2 w-full rounded-xl border-none bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-extrabold text-lg cursor-pointer shadow-lg shadow-amber-500/30 py-3 px-4 transition hover:shadow-amber-500/45"
                  @click="handleSpin"
                >
                  {{ isSpinning ? 'Girando...' : 'Spin it' }}
                </button>
              </form>
            </div>
            <p
              class="lg:col-span-2 w-full text-center text-xs uppercase tracking-[0.18em] pt-1"
              :class="themeTokens.footerText"
            >
              power by ruletaxpress
            </p>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
@import 'tailwindcss';

:host {
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

button {
  appearance: none;
}
</style>
