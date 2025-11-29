export type FormField = {
  type: string
  data: {
    label?: string
    key: string
    placeholder?: string
    required?: boolean
    helper?: string
  }
}

export type CampaignGame = {
  name: string
  config: {
    form_theme?: 'dark' | 'light'
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
      coupon_code?: string
      textFontFamily?: string | null
      textFontSize?: number | null
      textFontWeight?: string | null
      textFillStyle?: string | null
      textStrokeStyle?: string | null
      textMargin?: number | null
      textAlignment?: string | null
      textDirection?: string | null
      image?: string | null
      imageDirection?: string | null
      link?: string | null
      losingSegment?: boolean
      id?: number | null
      probability?: number
    }>
    animation?: Record<string, number | string>
    outerRadius?: number
    innerRadius?: number
    pointerAngle?: number
    pointer?: {
      position?:
        | 'top'
        | 'top-right'
        | 'right'
        | 'bottom-right'
        | 'bottom'
        | 'bottom-left'
        | 'left'
        | 'top-left'
      color?: string
      integratedOnButton?: boolean
    }
    lineWidth?: number
    strokeStyle?: string
    button?: {
      position?: 'center' | 'outside'
      size?: number
    }
  }
}

export type CampaignData = {
  code: string
  campaign_game: CampaignGame | null
}
