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
    }
    lineWidth?: number
    strokeStyle?: string
  }
}

export type CampaignData = {
  code: string
  campaign_game: CampaignGame | null
}
