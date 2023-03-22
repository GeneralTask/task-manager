import { TIconImage } from '../../styles/images'

export interface TDashboard {
    intervals: TInterval[]
    subjects: TSubject[]
    graphs: {
        [key: string]: TGraph // graph ID
    }
    data: {
        // subject ID
        [key: string]: {
            // interval ID
            [key: string]: {
                [key: string]: TData // data ID
            }
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
    subject_id_override?: string
}

export interface TData {
    aggregated_value: number
    points: TPoint[]
}

export interface TPoint {
    x: number
    y: number
}

export interface TDashboardTeamMember {
    id: string
    optimisticId?: string
    name: string
    email?: string
    github_id?: string
}
