import { TIconImage } from '../../styles/images'

export interface TMetric {
    name: string
    icon: TIconImage
    lines: TLine[]
    horizontal_lines?: THorizontalLine[]
}

export interface TLine {
    name: string
    color: string
    aggregated_name: string
    aggregated_value: number
    points: TPoint[]
}

interface TPoint {
    x: number
    y: number
}

export interface THorizontalLine {
    name: string
    value: number
    color: string
}

export interface TTeamMember {
    id: string
    name: string
}
