import { TDashboardView } from './types'

export const dummyAPIReponse: TDashboardView[] = [
    {
        id: 'id-1',
        name: 'Your team',
        icon: 'users',
        metrics: [
            {
                name: 'Focus time',
                icon: 'calendar_blank',
                lines: [
                    {
                        name: 'Daily average (Your team)',
                        color: '#DB2979',
                        aggregated_name: 'Weekly average (Your team)',
                        aggregated_value: 7.5,
                        points: [
                            { x: 1678098695, y: 600 },
                            { x: 1678185095, y: 1200 },
                            { x: 1678271495, y: 800 },
                            { x: 1678357895, y: 1600 },
                            { x: 1678444295, y: 800 },
                        ],
                    },
                    {
                        name: 'Daily average (Industry)',
                        color: '#cccccc',
                        aggregated_name: 'Weekly average (Industry)',
                        aggregated_value: 7.5,
                        points: [
                            { x: 1678098695, y: 1400 },
                            { x: 1678185095, y: 1800 },
                            { x: 1678271495, y: 1300 },
                            { x: 1678357895, y: 800 },
                            { x: 1678444295, y: 400 },
                        ],
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
                        aggregated_value: 7.5,
                        points: [
                            { x: 1678098695, y: 600 },
                            { x: 1678185095, y: 1200 },
                            { x: 1678271495, y: 800 },
                            { x: 1678357895, y: 1600 },
                            { x: 1678444295, y: 800 },
                        ],
                    },
                    {
                        name: 'Daily average (Industry)',
                        color: '#cccccc',
                        aggregated_name: 'Weekly average (Industry)',
                        aggregated_value: 7.5,
                        points: [
                            { x: 1678098695, y: 1400 },
                            { x: 1678185095, y: 1800 },
                            { x: 1678271495, y: 1300 },
                            { x: 1678357895, y: 800 },
                            { x: 1678444295, y: 400 },
                        ],
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
