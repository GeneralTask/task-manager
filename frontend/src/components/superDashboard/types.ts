import { TIconImage } from '../../styles/images'

export interface Dashboard {
    intervals: Interval[]
    subjects: Subject[]
    graphs: {
        [key: string]: Graph // key is prefixed with "graph_id"
    }
    data: {
        // key is prefixed with "interval_id"
        [key: string]: {
            [key: string]: Data // key is prefixed with "data_id" from Line
        }
    }
}

export type LineColor = 'pink' | 'gray' | 'blue'

export interface Interval {
    id: string
    date_start: string
    date_end: string
    is_default?: boolean
}

export interface Subject {
    id: string
    name: string
    icon: TIconImage
    is_default?: boolean
    graph_ids: string[]
}

export interface Graph {
    name: string
    icon: TIconImage
    lines: Line[]
}

export interface Line {
    data_id: string
    name: string
    color: LineColor
    aggregated_name: string
}

export interface Data {
    aggregated_value: number
    points: Point[]
}

export interface Point {
    x: number
    y: number
}
