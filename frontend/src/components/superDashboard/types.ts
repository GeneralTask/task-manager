import { TIconImage } from '../../styles/images'

export interface TDashboard {
    intervals: TInterval[]
    subjects: TSubject[]
    graphs: {
        [key: string]: TGraph // key is prefixed with "graph_id"
    }
    data: {
        // key is prefixed with "interval_id"
        [key: string]: {
            [key: string]: TData // key is prefixed with "data_id" from Line
        }
    }
}

export type TLineColor = 'pink' | 'gray' | 'blue'

export interface TInterval {
    id: string
    date_start: string
    date_end: string
    is_default?: boolean
}

export interface TSubject {
    id: string
    name: string
    icon: TIconImage
    is_default?: boolean
    graph_ids: string[]
}

export interface TGraph {
    name: string
    icon: TIconImage
    lines: TLine[]
}

export interface TLine {
    data_id: string
    name: string
    color: TLineColor
    aggregated_name: string
}

export interface TData {
    aggregated_value: number
    points: TPoint[]
}

export interface TPoint {
    x: number
    y: number
}
