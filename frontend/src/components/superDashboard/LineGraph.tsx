import { useMemo } from 'react'
import produce from 'immer'
import { DateTime } from 'luxon'
import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { BodyMedium } from '../atoms/typography/Typography'
import { DAYS_PER_WEEK, GRAPH_HEIGHT, GRAPH_RIGHT_MARGIN, GRAPH_TOP_MARGIN } from './constants'
import { TMetric } from './types'

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
}

const LineGraph = ({ data, startDate }: LineGraphProps) => {
    const endDate = startDate.plus({ days: DAYS_PER_WEEK - 1 })

    const slicedData = useMemo(() => {
        return produce(data.lines, (draft) => {
            draft.forEach((line) => {
                line.points = line.points.filter(
                    (point) => point.x >= startDate.toUnixInteger() && point.x <= endDate.toUnixInteger()
                )
            })
        })
    }, [data, startDate])

    const ticks = useMemo(() => {
        return Array.from({ length: DAYS_PER_WEEK }).map((_, i) => {
            const date = startDate.plus({ days: i })
            return date.toUnixInteger()
        })
    }, [startDate])

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
