<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Winwheel from '@/types/Winwheel'
import type {
  WinwheelAnimation,
  WinwheelInstance,
  WinwheelOptions,
  WinwheelPins,
  WinwheelSegment,
  WinwheelConstructor,
} from '@/types/winwheel-types'

type TemplateKey = 'vibrante' | 'donut' | 'gourmet' | 'monocroma' | 'festiva' | 'temus'
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
type WheelPosition = 'center' | 'left' | 'right' | 'top' | 'bottom'
type ButtonPosition = 'center' | 'outside'

interface Template {
  description: string
  outerRadius?: number
  innerRadius?: number
  textMargin?: number
  textAlignment?: string
  textFillStyle?: string
  textFontSize?: number
  textFontFamily?: string
  textFontWeight?: string
  textOrientation?: string
  textDirection?: string
  textStrokeStyle?: string
  textLineWidth?: number
  strokeStyle?: string
  lineWidth?: number
  drawMode?: string
  rotationAngle?: number
  clearTheCanvas?: boolean
  segments: WinwheelSegment[]
  pins?: WinwheelPins | null
  animation?: Partial<WinwheelAnimation>
  sound?: boolean
  soundTrigger?: 'pin' | 'segment'
}

type AudioName = 'tick' | 'wood' | 'bell' | 'pop' | 'click' | 'kids-music' | 'mute'
interface AudioEntry {
  files: string[]
  soundTrigger: 'pin' | 'segment'
  pins?: number
}

const pinDefaults: WinwheelPins = {
  outerRadius: 5,
  margin: 8,
  fillStyle: '#f8fafc',
  strokeStyle: '#0f172a',
  lineWidth: 1,
}

const templates: Record<TemplateKey, Template> = {
  vibrante: {
    description: 'Colores vivos, 8 premios y 32 pins para un tick marcado.',
    outerRadius: 195,
    innerRadius: 60,
    textMargin: 18,
    textAlignment: 'outer',
    textFillStyle: '#0f172a',
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
    pins: { number: 32, outerRadius: 5, margin: 8, fillStyle: '#f9fafb', strokeStyle: '#0f172a', lineWidth: 1 },
    animation: { duration: 6, spins: 8, easing: 'Power4.easeOut' },
    sound: true,
    soundTrigger: 'pin',
  },
  donut: {
    description: 'Donut minimal de 6 segmentos pastel, sin pins, texto centrado.',
    outerRadius: 175,
    innerRadius: 70,
    textAlignment: 'inner',
    textFontSize: 17,
    textMargin: 8,
    textFillStyle: '#0b132f',
    strokeStyle: '#e2e8f0',
    lineWidth: 2,
    segments: [
      { fillStyle: '#fde68a', text: 'Oro' },
      { fillStyle: '#c7d2fe', text: 'Plata' },
      { fillStyle: '#bfdbfe', text: 'Bronce' },
      { fillStyle: '#bbf7d0', text: 'Extra' },
      { fillStyle: '#fed7aa', text: 'Repetir' },
      { fillStyle: '#e5e7eb', text: 'Bonus' },
    ],
    pins: null,
    animation: { duration: 7, spins: 9, easing: 'Power2.easeOut' },
    sound: false,
  },
  gourmet: {
    description: 'Estilo gourmet de 10 premios, colores terrosos y pins finos.',
    outerRadius: 190,
    innerRadius: 55,
    textAlignment: 'outer',
    textMargin: 16,
    textFillStyle: '#0f172a',
    strokeStyle: '#f1f5f9',
    lineWidth: 2,
    segments: [
      { fillStyle: '#f59e0b', text: 'Tiramisu' },
      { fillStyle: '#c084fc', text: 'Macaron' },
      { fillStyle: '#f97316', text: 'Profiterol' },
      { fillStyle: '#34d399', text: 'Gelato' },
      { fillStyle: '#f472b6', text: 'Panna cotta' },
      { fillStyle: '#fb7185', text: 'Cheesecake' },
      { fillStyle: '#38bdf8', text: 'Pavlova' },
      { fillStyle: '#a855f7', text: 'Churro' },
      { fillStyle: '#eab308', text: 'Cannoli' },
      { fillStyle: '#22c55e', text: 'Sorbet' },
    ],
    pins: { number: 24, outerRadius: 4, margin: 10, fillStyle: '#f8fafc', strokeStyle: '#0f172a', lineWidth: 1 },
    animation: { duration: 7, spins: 10, easing: 'Power3.easeOut' },
    sound: true,
    soundTrigger: 'pin',
  },
  monocroma: {
    description: 'Look monocromo: degradado gris, texto blanco y pocas divisiones.',
    outerRadius: 185,
    innerRadius: 0,
    textAlignment: 'outer',
    textFontSize: 17,
    textFillStyle: '#f8fafc',
    strokeStyle: '#cbd5e1',
    lineWidth: 1,
    segments: [
      { fillStyle: '#1f2937', text: 'Premio alto' },
      { fillStyle: '#334155', text: 'Premio medio' },
      { fillStyle: '#0f172a', text: 'Premio top' },
      { fillStyle: '#475569', text: 'Sigue participando' },
    ],
    pins: { number: 12, outerRadius: 4, margin: 12, fillStyle: '#e2e8f0', strokeStyle: '#111827', lineWidth: 1 },
    animation: { duration: 5, spins: 6, easing: 'Power2.easeOut' },
    sound: true,
    soundTrigger: 'pin',
  },
  festiva: {
    description: 'Festiva: 12 segmentos, contrastes neones y muchos pins.',
    outerRadius: 195,
    innerRadius: 50,
    textAlignment: 'outer',
    textMargin: 14,
    textFillStyle: '#0c111d',
    strokeStyle: '#0ea5e9',
    lineWidth: 2,
    segments: [
      { fillStyle: '#7dd3fc', text: 'Stickers' },
      { fillStyle: '#22c55e', text: 'Merch' },
      { fillStyle: '#f59e0b', text: 'Gift card' },
      { fillStyle: '#fb7185', text: 'Camisa' },
      { fillStyle: '#a855f7', text: 'Taza' },
      { fillStyle: '#06b6d4', text: 'Suscripcion' },
      { fillStyle: '#f472b6', text: 'Poster' },
      { fillStyle: '#84cc16', text: 'Gorra' },
      { fillStyle: '#f43f5e', text: 'Mystery' },
      { fillStyle: '#0ea5e9', text: 'Tokens' },
      { fillStyle: '#eab308', text: 'Upgrade' },
      { fillStyle: '#10b981', text: 'Reset' },
    ],
    pins: { number: 40, outerRadius: 5, margin: 6, fillStyle: '#f8fafc', strokeStyle: '#0f172a', lineWidth: 1 },
    animation: { duration: 7, spins: 12, easing: 'Power4.easeOut' },
    sound: true,
    soundTrigger: 'pin',
  },
  temus: {
    description: 'Estilo inspirado en cupones Temu: 4 premios, naranja y crema, con borde claro.',
    outerRadius: 190,
    innerRadius: 55,
    textAlignment: 'outer',
    textMargin: 18,
    textFillStyle: '#0f172a',
    textFontSize: 18,
    strokeStyle: '#fef3c7',
    lineWidth: 3,
    segments: [
      { fillStyle: '#f97316', text: 'MXN 3,000' },
      { fillStyle: '#fde68a', text: 'MXN 100' },
      { fillStyle: '#f97316', text: 'MXN 500' },
      { fillStyle: '#fde68a', text: 'Cupón especial' },
    ],
    pins: { number: 16, outerRadius: 5, margin: 6, fillStyle: '#fef3c7', strokeStyle: '#0f172a', lineWidth: 1 },
    animation: { duration: 6.5, spins: 10, easing: 'Power3.easeOut' },
    sound: true,
    soundTrigger: 'pin',
  },
}

const audioLibrary: Record<AudioName, AudioEntry> = {
  tick: { files: ['sound/tick.wav', 'sound/tick.mp3'], soundTrigger: 'pin' },
  wood: { files: ['sound/wood.wav', 'sound/wood.mp3'], soundTrigger: 'pin', pins: 32 },
  bell: { files: ['sound/bell.wav', 'sound/bell.mp3'], soundTrigger: 'segment' },
  pop: { files: ['sound/pop.wav', 'sound/pop.mp3'], soundTrigger: 'segment' },
  click: { files: ['sound/click.wav', 'sound/click.mp3'], soundTrigger: 'pin', pins: 24 },
  'kids-music': { files: ['sound/kids-music.mp3'], soundTrigger: 'segment' },
  mute: { files: [], soundTrigger: 'segment' },
}

type AudioKey = AudioName | null

const canvasId = 'wheel-canvas'
const wheel = ref<WinwheelInstance | null>(null)
const isSpinning = ref(false)
const isReady = ref(false)
const copyState = ref<'idle' | 'copied' | 'selected'>('idle')
const copyPreviewRef = ref<HTMLElement | null>(null)

const selectedTemplate = ref<TemplateKey>('vibrante')
const segments = ref<WinwheelSegment[]>([])
const newSegment = reactive({
  color: '#f97316',
  text: '',
  discountCode: '',
  link: '',
  probability: 0,
  textFontSize: 16,
  textFontWeight: 'bold',
  textFontFamily: 'Arial',
  strokeStyle: '#0f172a',
  textStrokeStyle: '#0f172a',
  losingSegment: false,
})
const pointerStyle = ref<PointerStyle>('triangle')
const pointerColor = ref('#fbbf24')
const pointerPosition = ref<PointerPosition>('top')
const wheelPosition = ref<WheelPosition>('center')
const buttonPosition = ref<ButtonPosition>('center')
const buttonSize = ref(130)
const pointerOnButton = ref(false)
const audioKey = ref<AudioKey>('tick')
const pointerEl = ref<HTMLDivElement | null>(null)
const spinButtonRef = ref<HTMLButtonElement | null>(null)

const advanced = reactive({
  strokeStyle: '#0f172a',
  lineWidth: '',
  drawMode: '',
  rotationAngle: '',
  clearTheCanvas: false,
  textFontFamily: '',
  textFontWeight: '',
  textOrientation: '',
  textDirection: '',
  textAlignment: '',
  textStrokeStyle: '#0f172a',
  textLineWidth: '',
  animType: '',
  animDuration: '',
  animSpins: '',
  animStopAngle: '',
  animDirection: '',
  animEasing: '',
  animRepeat: '',
  pinsNumber: '',
  pinsOuterRadius: '',
  pinsMargin: '',
  pinsFillStyle: '#f8fafc',
  pinsStrokeStyle: '#0f172a',
  pinsLineWidth: '',
})

const pointerAngles: Record<PointerPosition, number> = {
  top: 0,
  'top-right': 45,
  right: 90,
  'bottom-right': 135,
  bottom: 180,
  'bottom-left': 225,
  left: 270,
  'top-left': 315,
}

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

const wheelPlacement = {
  center: { justifySelf: 'center', alignSelf: 'center' },
  left: { justifySelf: 'start', alignSelf: 'center' },
  right: { justifySelf: 'end', alignSelf: 'center' },
  top: { justifySelf: 'center', alignSelf: 'start' },
  bottom: { justifySelf: 'center', alignSelf: 'end' },
}

const templateOptions = [
  { value: 'vibrante', label: 'Vibrante de 8' },
  { value: 'donut', label: 'Donut minimal' },
  { value: 'gourmet', label: 'Gourmet' },
  { value: 'monocroma', label: 'Monocroma' },
  { value: 'festiva', label: 'Festiva con pins' },
  { value: 'temus', label: 'Temus (cupones)' },
]

const pointerOptions: { value: PointerStyle; label: string }[] = [
  { value: 'triangle', label: 'Triángulo' },
  { value: 'arrow', label: 'Flecha' },
  { value: 'diamond', label: 'Rombo' },
  { value: 'kite', label: 'Cometa' },
  { value: 'shield', label: 'Escudo' },
  { value: 'tag', label: 'Etiqueta' },
  { value: 'chevron', label: 'Chevron' },
]

const pointerPositionOptions: { value: PointerPosition; label: string }[] = [
  { value: 'top', label: 'Arriba' },
  { value: 'top-right', label: 'Arriba derecha' },
  { value: 'right', label: 'Derecha' },
  { value: 'bottom-right', label: 'Abajo derecha' },
  { value: 'bottom', label: 'Abajo' },
  { value: 'bottom-left', label: 'Abajo izquierda' },
  { value: 'left', label: 'Izquierda' },
  { value: 'top-left', label: 'Arriba izquierda' },
]

const wheelPositionOptions: { value: WheelPosition; label: string }[] = [
  { value: 'center', label: 'Centro' },
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
  { value: 'top', label: 'Arriba' },
  { value: 'bottom', label: 'Abajo' },
]

const spinPositionOptions: { value: ButtonPosition; label: string }[] = [
  { value: 'center', label: 'Centro (dentro)' },
  { value: 'outside', label: 'Exterior (debajo)' },
]

const audioOptions: { value: AudioName; label: string }[] = [
  { value: 'tick', label: 'Tick clásico' },
  { value: 'wood', label: 'Madera' },
  { value: 'bell', label: 'Campana' },
  { value: 'pop', label: 'Pop' },
  { value: 'click', label: 'Click seco' },
  { value: 'kids-music', label: 'Kids music' },
  { value: 'mute', label: 'Silencio' },
]

const currentTemplate = computed(() => templates[selectedTemplate.value])

const templateDescription = computed(() => currentTemplate.value.description)

const wheelPlacementStyle = computed(() => wheelPlacement[wheelPosition.value])

const fontOptions = [
  'Arial',
  'Inter',
  'Roboto',
  'Montserrat',
  'Georgia',
  'Times New Roman',
]

const fontWeightOptions = ['normal', '500', '600', 'bold', '800']

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
}))

const pointerOnButtonDisabled = computed(() => buttonPosition.value === 'outside')

const buttonSizeLabel = computed(() => `${buttonSize.value} px`)

const currentAudioEntry = computed(() => (audioKey.value ? audioLibrary[audioKey.value] : null))
const audioNodes: Partial<Record<Exclude<AudioKey, null>, HTMLAudioElement>> = {}
const currentAudioNode = ref<HTMLAudioElement | null>(null)

let segmentDebounce: number | undefined

const valOr = <T>(value: T | undefined, fallback: T) => (value === undefined || value === null ? fallback : value)

const asNumber = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const normalizeAdvanced = () => ({
  strokeStyle: advanced.strokeStyle || undefined,
  lineWidth: asNumber(advanced.lineWidth),
  drawMode: advanced.drawMode || undefined,
  rotationAngle: asNumber(advanced.rotationAngle),
  clearTheCanvas: advanced.clearTheCanvas,
  textFontFamily: advanced.textFontFamily || undefined,
  textFontWeight: advanced.textFontWeight || undefined,
  textOrientation: advanced.textOrientation || undefined,
  textDirection: advanced.textDirection || undefined,
  textAlignment: advanced.textAlignment || undefined,
  textStrokeStyle: advanced.textStrokeStyle || undefined,
  textLineWidth: asNumber(advanced.textLineWidth),
  animType: advanced.animType || undefined,
  animDuration: asNumber(advanced.animDuration),
  animSpins: asNumber(advanced.animSpins),
  animStopAngle: asNumber(advanced.animStopAngle),
  animDirection: advanced.animDirection || undefined,
  animEasing: advanced.animEasing || undefined,
  animRepeat: asNumber(advanced.animRepeat),
  pinsNumber: asNumber(advanced.pinsNumber),
  pinsOuterRadius: asNumber(advanced.pinsOuterRadius),
  pinsMargin: asNumber(advanced.pinsMargin),
  pinsFillStyle: advanced.pinsFillStyle || undefined,
  pinsStrokeStyle: advanced.pinsStrokeStyle || undefined,
  pinsLineWidth: asNumber(advanced.pinsLineWidth),
})

const cloneSegments = (list: WinwheelSegment[]) => list.map((seg) => ({ ...seg }))

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

const getAudioNode = (key: Exclude<AudioKey, null>) => {
  const entry = audioLibrary[key]
  if (!entry || !entry.files.length) return null
  if (!audioNodes[key]) {
    audioNodes[key] = createAudio(entry.files)
  }
  return audioNodes[key] ?? null
}

const setCurrentAudio = (key: AudioKey) => {
  if (!key) {
    currentAudioNode.value = null
    return
  }
  currentAudioNode.value = getAudioNode(key)
}

const playTick = () => {
  if (!currentAudioNode.value) return
  const a = currentAudioNode.value.cloneNode(true) as HTMLAudioElement
  a.currentTime = 0
  void a.play().catch(() => {})
}

const applyPointerAngle = () => {
  if (!wheel.value) return
  wheel.value.pointerAngle = pointerAngles[pointerPosition.value] ?? 0
  wheel.value.draw()
}

const buildWheel = (resetSegments = false) => {
  if (!isReady.value) return

  const tpl = currentTemplate.value
  if (resetSegments) {
    segments.value = cloneSegments(tpl.segments)
  }

  if (wheel.value) {
    isSpinning.value = false
    try {
      wheel.value.stopAnimation(false)
    } catch {
      // ignore when no animation is running
    }
  }

  const adv = normalizeAdvanced()
  const templateAnimation = tpl.animation || {}
  const soundTrigger =
    currentAudioEntry.value?.soundTrigger || tpl.soundTrigger || (tpl.pins ? 'pin' : 'segment')

  const pinsFromAudio =
    currentAudioEntry.value && currentAudioEntry.value.pins
      ? { ...pinDefaults, number: currentAudioEntry.value.pins }
      : tpl.pins ?? undefined

  const pinOverride: WinwheelPins = {}
  if (adv.pinsNumber !== undefined) pinOverride.number = adv.pinsNumber
  if (adv.pinsOuterRadius !== undefined) pinOverride.outerRadius = adv.pinsOuterRadius
  if (adv.pinsMargin !== undefined) pinOverride.margin = adv.pinsMargin
  if (adv.pinsFillStyle) pinOverride.fillStyle = adv.pinsFillStyle
  if (adv.pinsStrokeStyle) pinOverride.strokeStyle = adv.pinsStrokeStyle
  if (adv.pinsLineWidth !== undefined) pinOverride.lineWidth = adv.pinsLineWidth

  const finalPins =
    Object.keys(pinOverride).length > 0
      ? { ...(pinsFromAudio || pinDefaults), ...pinOverride }
      : pinsFromAudio

  const wheelOptions: WinwheelOptions = {
    canvasId,
    numSegments: (segments.value.length || tpl.segments.length) as number,
    outerRadius: valOr(tpl.outerRadius, 190),
    innerRadius: buttonPosition.value === 'outside' ? 0 : valOr(tpl.innerRadius, 0),
    textFontSize: valOr(tpl.textFontSize, 16),
    textAlignment: adv.textAlignment || tpl.textAlignment || 'outer',
    textMargin: valOr(tpl.textMargin, 0),
    textFillStyle: tpl.textFillStyle || '#0f172a',
    textFontFamily: adv.textFontFamily || tpl.textFontFamily,
    textFontWeight: adv.textFontWeight || tpl.textFontWeight,
    textOrientation: adv.textOrientation || tpl.textOrientation,
    textDirection: adv.textDirection || tpl.textDirection,
    textStrokeStyle: adv.textStrokeStyle || tpl.textStrokeStyle,
    textLineWidth: adv.textLineWidth ?? tpl.textLineWidth,
    strokeStyle: adv.strokeStyle || tpl.strokeStyle || '#0f172a',
    lineWidth: adv.lineWidth ?? tpl.lineWidth,
    drawMode: adv.drawMode || tpl.drawMode,
    rotationAngle: adv.rotationAngle ?? tpl.rotationAngle,
    clearTheCanvas:
      typeof adv.clearTheCanvas === 'boolean' ? adv.clearTheCanvas : tpl.clearTheCanvas,
    segments: segments.value.length ? segments.value : tpl.segments,
    pins: finalPins,
    animation: {
      type: adv.animType || templateAnimation.type || 'spinToStop',
      duration: adv.animDuration ?? valOr(templateAnimation.duration, 6),
      spins: adv.animSpins ?? valOr(templateAnimation.spins, 8),
      easing: adv.animEasing || templateAnimation.easing || 'Power4.easeOut',
      direction: adv.animDirection || templateAnimation.direction,
      stopAngle: adv.animStopAngle ?? templateAnimation.stopAngle,
      repeat: adv.animRepeat ?? templateAnimation.repeat,
      callbackFinished: handleFinish,
      callbackSound: currentAudioNode.value ? playTick : null,
      soundTrigger,
    },
  }

  const WinwheelCtor = Winwheel as unknown as WinwheelConstructor
  wheel.value = new WinwheelCtor(wheelOptions)
  applyPointerAngle()
}

const queueBuildWheel = (resetSegments = false) => {
  if (!isReady.value) return
  window.clearTimeout(segmentDebounce)
  segmentDebounce = window.setTimeout(() => buildWheel(resetSegments), 120)
}

const handleSpin = () => {
  if (isSpinning.value || !wheel.value) return
  isSpinning.value = true
  wheel.value.startAnimation()
}

const handleFinish = (segment: WinwheelSegment) => {
  isSpinning.value = false
  window.alert(`¡Ha salido: ${segment.text}!`)
}

const addSegment = () => {
  const color = newSegment.color || '#f97316'
  const text = (newSegment.text || '').trim() || 'Segmento'
  segments.value = [
    ...segments.value,
    {
      fillStyle: color,
      text,
      discountCode: newSegment.discountCode || '',
      link: newSegment.link || '',
      probability: Number(newSegment.probability) || 0,
      textFontSize: Number(newSegment.textFontSize) || 16,
      textFontWeight: newSegment.textFontWeight || 'bold',
      textFontFamily: newSegment.textFontFamily || 'Arial',
      strokeStyle: newSegment.strokeStyle || '#0f172a',
      textStrokeStyle: newSegment.textStrokeStyle || '#0f172a',
      losingSegment: Boolean(newSegment.losingSegment),
    },
  ]
  newSegment.text = ''
  queueBuildWheel()
}

const removeSegment = (idx: number) => {
  segments.value = segments.value.filter((_, i) => i !== idx)
  queueBuildWheel()
}

const clearSegments = () => {
  segments.value = []
  queueBuildWheel(true)
}

const handleSegmentChange = () => {
  queueBuildWheel()
}

const copyLabel = computed(() => {
  if (copyState.value === 'copied') return 'Copiado'
  if (copyState.value === 'selected') return 'Seleccionado'
  return 'Copiar JSON'
})

const currentConfig = () => {
  const tpl = currentTemplate.value
  const adv = normalizeAdvanced()
  return {
    templateKey: selectedTemplate.value,
    wheel: {
      outerRadius: valOr(tpl.outerRadius, 190),
      innerRadius: buttonPosition.value === 'outside' ? 0 : valOr(tpl.innerRadius, 0),
      textFontSize: valOr(tpl.textFontSize, 16),
      textAlignment: adv.textAlignment || tpl.textAlignment || 'outer',
      textMargin: valOr(tpl.textMargin, 0),
      textFillStyle: tpl.textFillStyle || '#0f172a',
      textFontFamily: adv.textFontFamily || tpl.textFontFamily,
      textFontWeight: adv.textFontWeight || tpl.textFontWeight,
      textOrientation: adv.textOrientation || tpl.textOrientation,
      textDirection: adv.textDirection || tpl.textDirection,
      textStrokeStyle: adv.textStrokeStyle || tpl.textStrokeStyle,
      textLineWidth: adv.textLineWidth ?? tpl.textLineWidth,
      strokeStyle: adv.strokeStyle || tpl.strokeStyle || '#0f172a',
      lineWidth: adv.lineWidth ?? tpl.lineWidth,
      drawMode: adv.drawMode || tpl.drawMode,
      rotationAngle: adv.rotationAngle ?? tpl.rotationAngle,
      clearTheCanvas: typeof adv.clearTheCanvas === 'boolean' ? adv.clearTheCanvas : tpl.clearTheCanvas,
      pins: wheel.value?.pins ?? tpl.pins,
      animation: {
        type: adv.animType || tpl.animation?.type || 'spinToStop',
        duration: adv.animDuration ?? valOr(tpl.animation?.duration, 6),
        spins: adv.animSpins ?? valOr(tpl.animation?.spins, 8),
        easing: adv.animEasing || tpl.animation?.easing || 'Power4.easeOut',
        direction: adv.animDirection || tpl.animation?.direction,
        stopAngle: adv.animStopAngle ?? tpl.animation?.stopAngle,
        repeat: adv.animRepeat ?? tpl.animation?.repeat,
        soundTrigger:
          currentAudioEntry.value?.soundTrigger || tpl.soundTrigger || (tpl.pins ? 'pin' : 'segment'),
      },
      pointerAngle: wheel.value?.pointerAngle ?? pointerAngles[pointerPosition.value],
    },
    segments: segments.value.length ? segments.value : tpl.segments,
    pointer: {
      style: pointerStyle.value,
      color: pointerColor.value,
      position: pointerPosition.value,
      integratedOnButton: pointerOnButton.value,
    },
    button: {
      size: buttonSize.value,
      position: buttonPosition.value,
    },
    audio: {
      key: audioKey.value,
      soundTrigger:
        currentAudioEntry.value?.soundTrigger ||
        tpl.soundTrigger ||
        (wheel.value?.pins ? 'pin' : 'segment'),
      pins: currentAudioEntry.value?.pins ?? null,
    },
    layout: {
      wheelPosition: wheelPosition.value,
    },
  }
}

const configJson = computed(() => JSON.stringify(currentConfig(), null, 2))

const copyConfig = async () => {
  try {
    await navigator.clipboard.writeText(configJson.value)
    copyState.value = 'copied'
  } catch {
    const range = document.createRange()
    if (copyPreviewRef.value) {
      range.selectNodeContents(copyPreviewRef.value)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      copyState.value = 'selected'
    }
  }
  window.setTimeout(() => (copyState.value = 'idle'), 1200)
}

watch(
  () => selectedTemplate.value,
  (key) => {
    segments.value = cloneSegments(templates[key].segments)
    queueBuildWheel(true)
  },
)

watch(
  () => buttonPosition.value,
  (value) => {
    if (value === 'outside') {
      pointerOnButton.value = false
    }
    queueBuildWheel()
  },
)

watch(
  () => pointerPosition.value,
  () => {
    applyPointerAngle()
  },
)

watch(
  () => audioKey.value,
  (key) => {
    setCurrentAudio(key)
    queueBuildWheel()
  },
)

watch(
  () => segments.value,
  () => {
    queueBuildWheel()
  },
  { deep: true },
)

watch(
  advanced,
  () => queueBuildWheel(),
  { deep: true },
)

onMounted(() => {
  segments.value = cloneSegments(currentTemplate.value.segments)
  setCurrentAudio(audioKey.value)
  isReady.value = true
  buildWheel()
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
</script>

<template>
  <section class="builder-grid text-slate-100">
    <div class="panel space-y-3">
      <div class="space-y-1">
        <h1 class="text-lg font-semibold text-slate-50">Templates de Ruleta</h1>
        <small class="text-sm text-slate-300 leading-5">
          Elige un estilo de rueda para usarlo como base. Cada template muestra variaciones de colores,
          densidad de pins, tamaño del donut y enfoque visual.
        </small>
      </div>

      <div class="space-y-1">
        <label for="templateSelect" class="text-sm font-semibold text-slate-200">Template</label>
        <select
          id="templateSelect"
          v-model="selectedTemplate"
          class="w-full h-10 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
        >
          <option v-for="option in templateOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="pointerStyleSelect" class="text-sm font-semibold text-slate-200">Pointer</label>
        <select
          id="pointerStyleSelect"
          v-model="pointerStyle"
          class="w-full h-10 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
        >
          <option v-for="option in pointerOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="pointerColor" class="text-sm font-semibold text-slate-200">Color del pointer</label>
        <input
          id="pointerColor"
          v-model="pointerColor"
          type="color"
          class="w-full h-10 rounded-lg border border-slate-500/60 bg-slate-900/70 p-1"
        />
      </div>

      <div class="space-y-1">
        <label for="btnSize" class="text-sm font-semibold text-slate-200">Tamaño del botón</label>
        <input
          id="btnSize"
          v-model.number="buttonSize"
          type="range"
          min="90"
          max="170"
          class="w-full accent-orange-400"
        />
        <small class="text-xs text-slate-200">{{ buttonSizeLabel }}</small>
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-200">
        <input
          v-model="pointerOnButton"
          type="checkbox"
          :disabled="pointerOnButtonDisabled"
          class="accent-orange-400"
        />
        Pointer integrado en botón
      </label>

      <div class="space-y-1">
        <label for="spinPositionSelect" class="text-sm font-semibold text-slate-200">Ubicación del botón</label>
        <select
          id="spinPositionSelect"
          v-model="buttonPosition"
          class="w-full h-10 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
        >
          <option v-for="option in spinPositionOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="audioSelect" class="text-sm font-semibold text-slate-200">Audio del tick (carpeta sound)</label>
        <select
          id="audioSelect"
          v-model="audioKey"
          class="w-full h-10 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
        >
          <option v-for="option in audioOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="pointerPositionSelect" class="text-sm font-semibold text-slate-200">Posición del pointer</label>
        <select
          id="pointerPositionSelect"
          v-model="pointerPosition"
          class="w-full h-10 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
        >
          <option v-for="option in pointerPositionOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="wheelPosition" class="text-sm font-semibold text-slate-200">Posición de la rueda</label>
        <select
          id="wheelPosition"
          v-model="wheelPosition"
          class="w-full h-10 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
        >
          <option v-for="option in wheelPositionOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="note text-sm leading-5 text-slate-200">
        {{ templateDescription }}
      </div>
    </div>

    <div class="wheel-wrapper" :style="wheelPlacementStyle">
      <div
        v-show="!pointerOnButton"
        ref="pointerEl"
        class="pointer"
        :class="pointerStyle"
        :style="pointerVars"
      />
      <canvas :id="canvasId" width="420" height="420" class="wheel-canvas" />
      <button
        ref="spinButtonRef"
        type="button"
        class="spin-button"
        :class="spinButtonClasses"
        :style="spinButtonStyle"
        @click="handleSpin"
      >
        Girar
      </button>
    </div>

    <div id="segmentBuilder" class="panel space-y-3">
      <div class="space-y-1">
        <h1 class="text-lg font-semibold text-slate-50">Constructor de segmentos</h1>
        <small class="text-sm text-slate-300 leading-5">
          Agregar o quitar segmentos sin afectar el resto de controles. Cada línea crea un color y un texto.
        </small>
      </div>

      <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <label class="w-24 text-sm font-semibold text-slate-200" for="segmentColorInput">Color</label>
        <input
          id="segmentColorInput"
          v-model="newSegment.color"
            type="color"
            class="h-11 w-24 rounded-lg border border-slate-500/60 bg-slate-900/70"
          />
          <input
            id="segmentTextInput"
            v-model="newSegment.text"
            type="text"
            placeholder="Texto del segmento"
            class="flex-1 h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
        />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentTextFontSize">Tamaño texto</label>
          <input
            id="segmentTextFontSize"
            v-model.number="newSegment.textFontSize"
            type="number"
            min="8"
            step="1"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentWeight">Peso texto</label>
          <select
            id="segmentWeight"
            v-model="newSegment.textFontWeight"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option v-for="w in fontWeightOptions" :key="w" :value="w">{{ w }}</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentFontFamily">Fuente</label>
          <select
            id="segmentFontFamily"
            v-model="newSegment.textFontFamily"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option v-for="font in fontOptions" :key="font" :value="font">{{ font }}</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentProbability">Probabilidad (%)</label>
          <input
            id="segmentProbability"
            v-model.number="newSegment.probability"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentDiscount">Código descuento</label>
          <input
            id="segmentDiscount"
            v-model="newSegment.discountCode"
            type="text"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentLink">Link</label>
          <input
            id="segmentLink"
            v-model="newSegment.link"
            type="text"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 text-slate-100"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentStroke">Stroke</label>
          <input
            id="segmentStroke"
            v-model="newSegment.strokeStyle"
            type="color"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 p-1"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-semibold text-slate-200" for="segmentTextStroke">Stroke texto</label>
          <input
            id="segmentTextStroke"
            v-model="newSegment.textStrokeStyle"
            type="color"
            class="w-full h-11 rounded-lg border border-slate-500/60 bg-slate-900/70 p-1"
          />
        </div>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-200">
        <input v-model="newSegment.losingSegment" type="checkbox" class="accent-orange-400" />
        Segmento perdedor (no debe caer)
      </label>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-300 text-slate-900 font-bold py-2.5 shadow-lg hover:scale-[1.01] transition"
            @click="addSegment"
          >
            Agregar
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-500/70 px-4 text-slate-200 hover:bg-slate-800/70"
            @click="clearSegments"
          >
            Limpiar
          </button>
        </div>
        <div class="text-sm text-slate-300">Lista de segmentos ({{ segments.length }})</div>
        <ul class="space-y-2 max-h-64 overflow-auto">
          <li
            v-for="(seg, idx) in segments"
            :key="`${seg.text}-${idx}`"
            class="flex flex-col gap-2 bg-slate-900/70 border border-slate-600/50 rounded-lg px-3 py-2"
          >
            <div class="flex items-center gap-2">
              <input
                v-model="seg.fillStyle"
                type="color"
                class="h-9 w-12 rounded-md border border-slate-500/60 bg-slate-900/70"
                @input="handleSegmentChange"
              />
              <input
                v-model="seg.text"
                type="text"
                class="flex-1 h-9 rounded-md border border-slate-500/60 bg-slate-900/70 px-2 text-slate-100 text-sm"
                placeholder="Texto"
                @input="handleSegmentChange"
              />
              <input
                v-model.number="seg.probability"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-24 h-9 rounded-md border border-slate-500/60 bg-slate-900/70 px-2 text-slate-100 text-sm"
                placeholder="% prob."
                @input="handleSegmentChange"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="seg.discountCode"
                type="text"
                class="h-9 rounded-md border border-slate-500/60 bg-slate-900/70 px-2 text-slate-100 text-sm"
                placeholder="Código"
                @input="handleSegmentChange"
              />
              <input
                v-model="seg.link"
                type="text"
                class="h-9 rounded-md border border-slate-500/60 bg-slate-900/70 px-2 text-slate-100 text-sm"
                placeholder="Link"
                @input="handleSegmentChange"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="seg.textFontFamily"
                class="h-9 rounded-md border border-slate-500/60 bg-slate-900/70 px-2 text-slate-100 text-sm"
                @change="handleSegmentChange"
              >
                <option v-for="font in fontOptions" :key="font" :value="font">{{ font }}</option>
              </select>
              <select
                v-model="seg.textFontWeight"
                class="h-9 rounded-md border border-slate-500/60 bg-slate-900/70 px-2 text-slate-100 text-sm"
                @change="handleSegmentChange"
              >
                <option v-for="w in fontWeightOptions" :key="w" :value="w">{{ w }}</option>
              </select>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <input
                v-model.number="seg.textFontSize"
                type="number"
                min="8"
                step="1"
                class="h-9 rounded-md border border-slate-500/60 bg-slate-900/70 px-2 text-slate-100 text-sm"
                placeholder="Tamaño"
                @input="handleSegmentChange"
              />
              <input
                v-model="seg.strokeStyle"
                type="color"
                class="h-9 w-full rounded-md border border-slate-500/60 bg-slate-900/70 p-1"
                @input="handleSegmentChange"
              />
              <input
                v-model="seg.textStrokeStyle"
                type="color"
                class="h-9 w-full rounded-md border border-slate-500/60 bg-slate-900/70 p-1"
                @input="handleSegmentChange"
              />
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-xs text-slate-200">
                <input
                  v-model="seg.losingSegment"
                  type="checkbox"
                  class="accent-orange-400"
                  @change="handleSegmentChange"
                />
                Segmento perdedor
              </label>
              <button
                type="button"
                class="text-xs text-red-200 hover:text-red-100 border border-red-400/70 rounded px-2 py-1"
                @click="removeSegment(idx)"
              >
                Eliminar
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="panel panel-wide space-y-3">
      <div class="space-y-1">
        <h1 class="text-lg font-semibold text-slate-50">Config avanzada</h1>
        <small class="text-sm text-slate-300 leading-5">
          Ajusta opciones disponibles en Winwheel (colores de trazos, tipografías, modos de texto, animación y pins).
        </small>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="space-y-2">
          <label class="text-sm text-slate-200">Stroke wheel</label>
          <input
            v-model="advanced.strokeStyle"
            type="color"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 p-1"
          />
          <label class="text-sm text-slate-200">Ancho stroke</label>
          <input
            v-model="advanced.lineWidth"
            type="number"
            min="0"
            step="1"
            placeholder="lineWidth"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="text-sm text-slate-200">Draw mode</label>
          <select
            v-model="advanced.drawMode"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option value="">Default</option>
            <option value="segment">segment</option>
            <option value="image">image</option>
            <option value="segmentImage">segmentImage</option>
          </select>
          <label class="text-sm text-slate-200">Rotación inicial (grados)</label>
          <input
            v-model="advanced.rotationAngle"
            type="number"
            step="1"
            placeholder="0"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="flex items-center gap-2 text-sm text-slate-200 mt-1">
            <input v-model="advanced.clearTheCanvas" type="checkbox" class="accent-orange-400" />
            clearTheCanvas
          </label>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-slate-200">Tipografía</label>
          <input
            v-model="advanced.textFontFamily"
            type="text"
            placeholder="Ej: 'Inter', 'Arial'"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="text-sm text-slate-200">Peso texto</label>
          <input
            v-model="advanced.textFontWeight"
            type="text"
            placeholder="bold, 600..."
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="text-sm text-slate-200">Orientación texto</label>
          <select
            v-model="advanced.textOrientation"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option value="">Default</option>
            <option value="horizontal">horizontal</option>
            <option value="vertical">vertical</option>
            <option value="curved">curved</option>
          </select>
          <label class="text-sm text-slate-200">Dirección texto</label>
          <select
            v-model="advanced.textDirection"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option value="">Default</option>
            <option value="normal">normal</option>
            <option value="reversed">reversed</option>
          </select>
          <label class="text-sm text-slate-200">Alineación texto</label>
          <select
            v-model="advanced.textAlignment"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option value="">Default</option>
            <option value="inner">inner</option>
            <option value="outer">outer</option>
            <option value="center">center</option>
          </select>
          <label class="text-sm text-slate-200">Stroke texto</label>
          <input
            v-model="advanced.textStrokeStyle"
            type="color"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 p-1"
          />
          <label class="text-sm text-slate-200">Ancho stroke texto</label>
          <input
            v-model="advanced.textLineWidth"
            type="number"
            min="0"
            step="0.5"
            placeholder="1"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm text-slate-200">Animación - tipo</label>
          <select
            v-model="advanced.animType"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option value="">Default</option>
            <option value="spinToStop">spinToStop</option>
            <option value="spinOngoing">spinOngoing</option>
            <option value="spinAndBack">spinAndBack</option>
          </select>
          <label class="text-sm text-slate-200">Duración (s)</label>
          <input
            v-model="advanced.animDuration"
            type="number"
            step="0.1"
            placeholder="6"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="text-sm text-slate-200">Spins</label>
          <input
            v-model="advanced.animSpins"
            type="number"
            step="1"
            placeholder="8"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="text-sm text-slate-200">Stop angle</label>
          <input
            v-model="advanced.animStopAngle"
            type="number"
            step="1"
            placeholder="opcional"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="text-sm text-slate-200">Dirección</label>
          <select
            v-model="advanced.animDirection"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          >
            <option value="">Default</option>
            <option value="clockwise">clockwise</option>
            <option value="anti-clockwise">anti-clockwise</option>
          </select>
          <label class="text-sm text-slate-200">Easing (GSAP)</label>
          <input
            v-model="advanced.animEasing"
            type="text"
            placeholder="Power4.easeOut"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />
          <label class="text-sm text-slate-200">Repeat</label>
          <input
            v-model="advanced.animRepeat"
            type="number"
            step="1"
            placeholder="0"
            class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-3 text-slate-100"
          />

          <div class="grid grid-cols-3 gap-2 mt-2">
            <div>
              <label class="text-xs text-slate-200">Pins #</label>
              <input
                v-model="advanced.pinsNumber"
                type="number"
                min="0"
                step="1"
                placeholder="auto"
                class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-2 text-slate-100"
              />
            </div>
            <div>
              <label class="text-xs text-slate-200">Pin radio</label>
              <input
                v-model="advanced.pinsOuterRadius"
                type="number"
                min="0"
                step="1"
                placeholder="5"
                class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-2 text-slate-100"
              />
            </div>
            <div>
              <label class="text-xs text-slate-200">Pin margin</label>
              <input
                v-model="advanced.pinsMargin"
                type="number"
                min="0"
                step="1"
                placeholder="8"
                class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-2 text-slate-100"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="text-xs text-slate-200">Pin fill</label>
              <input
                v-model="advanced.pinsFillStyle"
                type="color"
                class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 p-1"
              />
            </div>
            <div>
              <label class="text-xs text-slate-200">Pin stroke</label>
              <input
                v-model="advanced.pinsStrokeStyle"
                type="color"
                class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 p-1"
              />
            </div>
            <div>
              <label class="text-xs text-slate-200">Pin lineWidth</label>
              <input
                v-model="advanced.pinsLineWidth"
                type="number"
                min="0"
                step="0.5"
                placeholder="1"
                class="w-full h-10 rounded-lg border border-slate-600/60 bg-slate-900/70 px-2 text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel panel-wide space-y-3">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-lg font-semibold text-slate-50">JSON de configuración</h1>
          <small class="text-sm text-slate-300 leading-5">
            Copia y pega esta configuración para reconstruir la ruleta con los parámetros actuales.
          </small>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-500/70 px-4 py-2 text-slate-100 hover:bg-slate-800/80 text-sm"
          @click="copyConfig"
        >
          {{ copyLabel }}
        </button>
      </div>
      <pre
        ref="copyPreviewRef"
        class="w-full bg-slate-950/70 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-100 overflow-auto"
        style="max-height: 260px"
      >{{ configJson }}</pre>
    </div>
  </section>
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
