import type { WinwheelSegment, WinwheelOptions } from '@/types/winwheel-types'

export interface WheelPointer {
  style?: string
  color?: string
  position?:
    | 'top'
    | 'top-right'
    | 'right'
    | 'bottom-right'
    | 'bottom'
    | 'bottom-left'
    | 'left'
    | 'top-left'
  integratedOnButton?: boolean
}

export interface WheelButton {
  size?: number
  position?: 'center' | 'outside'
}

export interface WheelAudio {
  key?: string | null
  soundTrigger?: 'pin' | 'segment'
  pins?: number | null
}

export interface WheelLayout {
  wheelPosition?: 'center' | 'left' | 'right' | 'top' | 'bottom'
}

export interface WheelConfig {
  templateKey?: string
  wheel: Partial<WinwheelOptions> & { pointerAngle?: number }
  segments: WinwheelSegment[]
  pointer?: WheelPointer
  button?: WheelButton
  audio?: WheelAudio
  layout?: WheelLayout
}

export const defaultWheelConfig: WheelConfig = {
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
    animation: { type: 'spinToStop', duration: 6, spins: 8, easing: 'Power4.easeOut' },
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
  pointer: { color: '#fbbf24', position: 'top', style: 'triangle' },
  button: { size: 140, position: 'center' },
  layout: { wheelPosition: 'center' },
  audio: { key: 'tick', soundTrigger: 'pin', pins: 32 },
}
