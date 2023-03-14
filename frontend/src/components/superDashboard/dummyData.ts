import { DateTime } from 'luxon'
import { TDashboardView } from './types'

const START_DATE = DateTime.local().startOf('day').minus({ days: 33 })
const Y_MIN = 200
const Y_MAX = 3000

// generates multiple weeks of random points - sample output:
// { x: 1678098695, y: 1400 },
// { x: 1678185095, y: 1800 },
// ...
const getRandomPoints = () =>
    Array.from({ length: 66 }, (_, i) => ({
        x: START_DATE.plus({ days: i }).toUnixInteger(),
        y: Math.floor(Math.random() * (Y_MAX - Y_MIN + 1)) + Y_MIN,
    }))

export const dummyAPIReponse: TDashboardView[] = [
    {
        id: 'id-1',
        name: 'Your team',
        icon: 'users',
        metrics: [
            {
                name: 'Focus time',
                icon: 'gcal',
                lines: [
                    {
                        name: 'Daily average (Your team)',
                        color: '#DB2979',
                        aggregated_name: 'Weekly average (Your team)',
                        aggregated_value: 2400,
                        points: getRandomPoints(),
                    },
                    {
                        name: 'Daily average (Industry)',
                        color: '#cccccc',
                        aggregated_name: 'Weekly average (Industry)',
                        aggregated_value: 1000,
                        points: getRandomPoints(),
                    },
                ],
            },
            {
                name: 'Code review response time',
                icon: 'github',
                lines: [
                    {
                        name: 'Daily average (Your team)',
                        color: '#DB2979',
                        aggregated_name: 'Weekly average (Your team)',
                        aggregated_value: 1800,
                        points: getRandomPoints(),
                    },
                    {
                        name: 'Daily average (Industry)',
                        color: '#cccccc',
                        aggregated_name: 'Weekly average (Industry)',
                        aggregated_value: 500,
                        points: getRandomPoints(),
                    },
                ],
            },
        ],
    },
    {
        id: 'id-2',
        name: 'John',
        icon: 'user',
        metrics: [],
    },
]

export default dummyAPIReponse
