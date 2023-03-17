import { DateTime } from 'luxon'
import type { TDashboard } from './types'

const START_DATE = DateTime.local().startOf('week')
const Y_MIN = 200
const Y_MAX = 3000

const getRandomPoints = (startDate: DateTime) =>
    Array.from({ length: 5 }, (_, i) => ({
        x: startDate.plus({ days: i }).toUnixInteger(),
        y: Math.floor(Math.random() * (Y_MAX - Y_MIN + 1)) + Y_MIN,
    }))

const dummyData: TDashboard = {
    intervals: [
        {
            id: 'interval_id123',
            date_start: '2023-03-13',
            date_end: '2023-03-17',
            is_default: true,
        },
        {
            id: 'interval_idincomplete',
            date_start: '2023-03-20',
            date_end: '2023-03-24',
        },
    ],
    subjects: [
        {
            id: 'subject_id1234',
            name: 'Your team',
            icon: 'users',
            is_default: true,
            graph_ids: ['graph_idyou', 'graph_idindustry'],
        },
        {
            id: 'scott',
            name: 'Scott',
            icon: 'priority_urgent',
            graph_ids: ['graph_idyou', 'graph_idindustry'],
        },
        {
            id: 'john',
            name: 'John',
            icon: 'user',
            graph_ids: ['graph_idyou', 'graph_idindustry'],
        },
        {
            id: 'jiyoon',
            name: 'Ji Yoon',
            icon: 'user',
            graph_ids: [],
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
                    name: 'Daily average (your team)',
                    color: 'pink',
                    aggregated_name: 'Weekly average (your team)',
                },
                {
                    data_id: 'data_idfocus2',
                    name: 'Daily average (your team)',
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
                    name: 'Daily average (your team)',
                    color: 'blue',
                    aggregated_name: 'Weekly average (your team)',
                },
                {
                    data_id: 'data_idcode2',
                    name: 'Daily average (your team)',
                    color: 'gray',
                    aggregated_name: 'Weekly average (industry)',
                },
            ],
        },
    },
    // there will not necessarily be data available for all intervals and all lines
    data: {
        subject_id1234: {
            interval_id123: {
                data_idfocus1: {
                    aggregated_value: 1000,
                    points: getRandomPoints(START_DATE),
                },
                data_idfocus2: {
                    aggregated_value: 2000,
                    points: getRandomPoints(START_DATE),
                },
                data_idcode1: {
                    aggregated_value: 2400,
                    points: getRandomPoints(START_DATE),
                },
                data_idcode2: {
                    aggregated_value: 600,
                    points: getRandomPoints(START_DATE),
                },
            },
            interval_idincomplete: {
                data_idfocus1: {
                    aggregated_value: 1400,
                    points: getRandomPoints(START_DATE.plus({ week: 1 })),
                },
                data_idcode1: {
                    aggregated_value: 1800,
                    points: getRandomPoints(START_DATE.plus({ week: 1 })),
                },
                data_idcode2: {
                    aggregated_value: 1600,
                    points: getRandomPoints(START_DATE.plus({ week: 1 })),
                },
            },
        },
        scott: {
            interval_id123: {
                data_idfocus1: {
                    aggregated_value: 1000,
                    points: getRandomPoints(START_DATE),
                },
                data_idfocus2: {
                    aggregated_value: 2000,
                    points: getRandomPoints(START_DATE),
                },
                data_idcode1: {
                    aggregated_value: 2400,
                    points: getRandomPoints(START_DATE),
                },
                data_idcode2: {
                    aggregated_value: 600,
                    points: getRandomPoints(START_DATE),
                },
            },
        },
        john: {
            interval_id123: {
                data_idfocus1: {
                    aggregated_value: 1000,
                    points: getRandomPoints(START_DATE),
                },
                data_idcode1: {
                    aggregated_value: 2400,
                    points: getRandomPoints(START_DATE),
                },
            },
        },
    },
}

export default dummyData
