export interface WinwheelSegment {
  fillStyle?: string
  text?: string
  [key: string]: unknown
}

export interface WinwheelPins {
  number?: number
  outerRadius?: number
  margin?: number
  fillStyle?: string
  strokeStyle?: string
  lineWidth?: number
}

export interface WinwheelAnimation {
  type?: string
  duration?: number
  spins?: number
  easing?: string
  direction?: string
  stopAngle?: number
  repeat?: number
  callbackFinished?: (indicatedSegment: WinwheelSegment) => void
  callbackSound?: (() => void) | null
  soundTrigger?: 'pin' | 'segment'
}

export interface WinwheelOptions {
  canvasId: string
  canvasElement?: HTMLCanvasElement | null
  numSegments: number
  outerRadius: number
  innerRadius?: number
  textFontSize?: number
  textAlignment?: string
  textMargin?: number
  textFillStyle?: string
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
  animation?: WinwheelAnimation
}

export type WinwheelInstance = {
  animation: WinwheelAnimation
  pins?: WinwheelPins | null
  pointerAngle: number
  startAnimation: () => void
  stopAnimation: (stopSpin: boolean) => void
  draw: () => void
  getIndicatedSegment: () => WinwheelSegment
}

export type WinwheelConstructor = new (
  options: WinwheelOptions,
  drawWheel?: boolean,
) => WinwheelInstance
