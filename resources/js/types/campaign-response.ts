export type CampaignResponse = {
  id: number
  team_id: number
  name: string
  slug: string
  code: string
  status: number
  starts_at: string | null
  ends_at: string | null
  description: string | null
  terms: string | null
  company_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_phone_country_code: string | null
  multiple: boolean
  max_participants: number | null
  options: Record<string, unknown> | null
  created_at: string
  updated_at: string
  team: {
    id: number
    name: string
  }
  media: MediaItem[]
  campaign_game: CampaignGame
}

export type MediaItem = {
  id: number
  name: string
  file_name: string
  mime_type: string
  size: number
  url: string
  collection?: string | null
  // optional fields commonly used for images
  alt?: string | null
}

export type CampaignGame = {
  id: number
  name: string
  slug: string
  config: CampaignGameConfig
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  max_plays_per_subscriber: number | null
  max_total_plays: number | null
  media: MediaItem[]
}

export type CampaignGameConfig = {
  canvasId?: string
  centerX?: number | null
  centerY?: number | null
  outerRadius?: number
  innerRadius?: number
  numSegments?: number
  lineWidth?: number
  strokeStyle?: string
  fillStyle?: string
  drawMode?: string
  rotationAngle?: number
  pointerAngle?: number
  drawText?: boolean
  textFontFamily?: string
  textFontSize?: number
  textFontWeight?: string
  textOrientation?: string
  textAlignment?: string
  textDirection?: string
  textMargin?: number
  textFillStyle?: string
  textStrokeStyle?: string
  textLineWidth?: number
  clearTheCanvas?: boolean
  imageOverlay?: boolean
  drawWheel?: boolean
  drawSegments?: boolean
  drawWheelImage?: boolean
  responsive?: boolean
  responsiveScaleHeight?: boolean
  responsiveScaleWidth?: boolean
  responsiveMargin?: number
  segments?: CampaignSegment[]
  pins?: CampaignPins
  animation?: CampaignAnimation
  form_header?: {
    title?: string
    description?: string
  }
  form?: Record<string, CampaignFormField>
  form_theme?: 'dark' | 'light'
  cta_button?: {
    label?: string
    bg_color?: string
    text_color?: string
    full_width?: boolean
    align?: string
  }
}

export type CampaignSegment = {
  fillStyle?: string
  strokeStyle?: string
  lineWidth?: number
  text?: string
  textFontFamily?: string | null
  textFontSize?: number | null
  textFontWeight?: string | null
  textFillStyle?: string | null
  textStrokeStyle?: string | null
  textMargin?: number | null
  textAlignment?: string | null
  textDirection?: string | null
  image?: string | null
  imageDirection?: string
  cupon?: string
  label?: string
  link?: string
}

export type CampaignPins = {
  number?: number
  outerRadius?: number
  margin?: number
  fillStyle?: string
  strokeStyle?: string
  responsive?: boolean
}

export type CampaignAnimation = {
  type?: string
  direction?: string
  duration?: number
  spins?: number
  easing?: string
  repeat?: number
  yoyo?: boolean
  stopAngle?: number | null
  spinToStop?: boolean
  clearTheCanvas?: boolean
  callbackFinished?: string | null
  callbackBefore?: string | null
  callbackAfter?: string | null
  callbackSound?: string | null
  soundTrigger?: string
}

export type CampaignFormField = {
  type: string
  data: {
    label?: string
    key: string
    placeholder?: string
    required?: boolean
    helper?: string
  }
}
