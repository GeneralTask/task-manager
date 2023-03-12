/* 
    variables
    date range
    team member

*/
import { TMetric } from './types'

const dummyDashboard2: TMetric = {
    name: 'Code review response time',
    icon: 'github',
    lines: [
        {
            name: 'Daily average (Your team)',
            color: '#DB2979',
            aggregated_name: 'Weekly average (Your team)',
            aggregated_value: 7.5,
            points: [
                { x: 1678098695, y: 10 },
                { x: 1678185095, y: 20 },
                { x: 1678271495, y: 15 },
                { x: 1678357895, y: 25 },
                { x: 1678444295, y: 20 },
            ],
        },
        {
            name: 'Daily average (Industry)',
            color: '#cccccc',
            aggregated_name: 'Weekly average (Industry)',
            aggregated_value: 7.5,
            points: [
                { x: 1678098695, y: 25 },
                { x: 1678185095, y: 29 },
                { x: 1678271495, y: 24 },
                { x: 1678357895, y: 12 },
                { x: 1678444295, y: 8 },
            ],
        },
    ],
}

const teamMembers = [
    {
        id: 'id-1',
        name: 'John',
    },
    {
        id: 'id-2',
        name: 'Scott',
    },
]

export const dummyAPIReponse = {
    metrics: [
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
                        { x: 1678098695, y: 10 },
                        { x: 1678185095, y: 20 },
                        { x: 1678271495, y: 15 },
                        { x: 1678357895, y: 25 },
                        { x: 1678444295, y: 20 },
                    ],
                },
                {
                    name: 'Daily average (Industry)',
                    color: '#cccccc',
                    aggregated_name: 'Weekly average (Industry)',
                    aggregated_value: 7.5,
                    points: [
                        { x: 1678098695, y: 25 },
                        { x: 1678185095, y: 29 },
                        { x: 1678271495, y: 24 },
                        { x: 1678357895, y: 12 },
                        { x: 1678444295, y: 8 },
                    ],
                },
            ],
        },
    ],
    team_members: [
        {
            id: 'id-1',
            name: 'John',
        },
        {
            id: 'id-2',
            name: 'Scott',
        },
    ],
}

export default dummyAPIReponse
