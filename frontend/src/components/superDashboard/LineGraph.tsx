import { useMemo } from 'react'
import produce from 'immer'
import { DateTime } from 'luxon'
import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { BodyMedium } from '../atoms/typography/Typography'
import { TMetric } from './types'

const GRAPH_HEIGHT = 400
const GRAPH_TOP_MARGIN = 10 // needed so top point doesn't get cut off
const GRAPH_RIGHT_MARGIN = 30 // needed so last label doesn't get cut off

const StyledResponsiveContainer = styled(ResponsiveContainer)`
    /* tick labels */
    tspan {
        ${Typography.label.small};
    }
    /* axis lines */
    .recharts-cartesian-axis > line {
        stroke: ${Colors.background.sub};
    }
    .recharts-default-legend {
        display: flex;
        justify-content: space-between;
    }
`

interface LineGraphProps {
    data: TMetric
    startDate: DateTime
    endDate: DateTime
}

const LineGraph = ({ data, startDate, endDate }: LineGraphProps) => {
    const slicedData = useMemo(() => {
        return produce(data.lines, (draft) => {
            draft.forEach((line) => {
                line.points = line.points.filter(
                    (point) => point.x >= startDate.toUnixInteger() && point.x <= endDate.toUnixInteger()
                )
            })
        })
    }, [data, startDate, endDate])

    const ticks = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => {
            const date = startDate.plus({ days: i })
            return date.toUnixInteger()
        })
    }, [startDate, endDate])

    return (
        <StyledResponsiveContainer height={GRAPH_HEIGHT}>
            <ScatterChart margin={{ top: GRAPH_TOP_MARGIN, right: GRAPH_RIGHT_MARGIN }}>
                <CartesianGrid stroke={Colors.background.sub} />
                <XAxis
                    dataKey="x"
                    type="number"
                    scale="time"
                    domain={[startDate.toUnixInteger(), endDate.toUnixInteger()]}
                    tickFormatter={(unixTime: number) => DateTime.fromSeconds(unixTime).toFormat('EEE MM/dd')}
                    ticks={ticks}
                    tickLine={false}
                    stroke={Colors.text.muted}
                    interval={0}
                    width={0}
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
                {slicedData.map((line) => (
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
