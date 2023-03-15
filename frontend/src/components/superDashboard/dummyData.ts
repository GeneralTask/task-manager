import { DateTime } from 'luxon'
import type { Dashboard } from './types'

const START_DATE = DateTime.local().startOf('week')
const Y_MIN = 200
const Y_MAX = 3000

const getRandomPoints = () =>
    Array.from({ length: 5 }, (_, i) => ({
        x: START_DATE.plus({ days: i }).toUnixInteger(),
        y: Math.floor(Math.random() * (Y_MAX - Y_MIN + 1)) + Y_MIN,
    }))

const dummyData: Dashboard = {
    intervals: [
        {
            id: 'interval_id123',
            date_start: '2023-03-13',
            date_end: '2023-03-17',
            is_default: true,
        },
    ],
    subjects: [
        {
            id: '1234',
            name: 'Your team',
            icon: 'users',
            is_default: true,
            graph_ids: ['graph_idyou', 'graph_idindustry'],
        },
    ],
    // you can assume graph definitions will exist for graph ids provided above
    graphs: {
        graph_idyou: {
            name: 'Hocus focus time',
            icon: 'gcal',
            lines: [
                {
                    data_id: 'data_idfocus1',
                    name: 'Daily average',
                    color: 'pink',
                    aggregated_name: 'Weekly average (your team)',
                },
                {
                    data_id: 'data_idfocus2',
                    name: 'Daily average',
                    color: 'gray',
                    aggregated_name: 'Weekly average (industry)',
                },
            ],
        },
        graph_idindustry: {
            name: 'Code review response time',
            icon: 'github',
            lines: [
                {
                    data_id: 'data_idcode1',
                    name: 'Daily average',
                    color: 'blue',
                    aggregated_name: 'Weekly average (your team)',
                },
                {
                    data_id: 'data_idcode2',
                    name: 'Daily average',
                    color: 'gray',
                    aggregated_name: 'Weekly average (industry)',
                },
            ],
        },
    },
    // there will not necessarily be data available for all intervals and all lines
    data: {
        interval_id123: {
            data_idfocus1: {
                aggregated_value: 1000,
                points: getRandomPoints(),
            },
            data_idfocus2: {
                aggregated_value: 2000,
                points: getRandomPoints(),
            },
            data_idcode1: {
                aggregated_value: 2400,
                points: getRandomPoints(),
            },
            data_idcode2: {
                aggregated_value: 600,
                points: getRandomPoints(),
            },
        },
    },
}

export default dummyData
