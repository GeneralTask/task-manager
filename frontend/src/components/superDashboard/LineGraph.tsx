import { DateTime } from 'luxon'
import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { BodyMedium } from '../atoms/typography/Typography'
import { TMetric } from './types'

const GRAPH_HEIGHT = 400

const StyledResponsiveContainer = styled(ResponsiveContainer)`
    /* tick labels */
    tspan {
        ${Typography.label.small};
    }
    /* axis lines */
    .recharts-cartesian-axis > line {
        stroke: ${Colors.background.sub};
    }
`

interface LineGraphProps {
    data: TMetric
}

const LineGraph = ({ data }: LineGraphProps) => {
    return (
        <StyledResponsiveContainer width="100%" height={GRAPH_HEIGHT}>
            <ScatterChart>
                <CartesianGrid stroke={Colors.background.sub} />
                <XAxis
                    dataKey="x"
                    type="number"
                    scale="time"
                    domain={['auto', 'auto']}
                    tickFormatter={(unixTime: number) => DateTime.fromSeconds(unixTime).toFormat('EEE MM/dd')}
                    tickLine={false}
                    stroke={Colors.text.muted}
                />
                <YAxis
                    dataKey="y"
                    type="number"
                    name="minutes"
                    domain={['auto', 'auto']}
                    tickFormatter={(minutes: number) => `${Math.round(minutes / 60)}`}
                    tickLine={false}
                    stroke={Colors.text.muted}
                />
                <Legend formatter={(value) => <BodyMedium color="muted">{value}</BodyMedium>} />
                {data.lines.map((line) => (
                    <Scatter
                        key={line.name}
                        name={line.name}
                        data={line.points}
                        fill={line.color}
                        line
                        lineType="joint"
                        lineJointType="monotoneX"
                    />
                ))}
            </ScatterChart>
        </StyledResponsiveContainer>
    )
}

export default LineGraph
