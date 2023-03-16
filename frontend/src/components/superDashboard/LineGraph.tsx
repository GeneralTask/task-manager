import { Fragment, useMemo } from 'react'
import { DateTime } from 'luxon'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { BodyMedium } from '../atoms/typography/Typography'
import { useSuperDashboardContext } from './SuperDashboardContext'
import {
    DAYS_PER_WEEK,
    GRAPH_HEIGHT,
    GRAPH_RIGHT_MARGIN,
    GRAPH_TOP_MARGIN,
    LINE_ANIMATION_DURATION,
    LINE_STROKE_WIDTH,
    STROKE_DASH_ARRAY,
} from './constants'
import { getLineColor } from './utils'

const StyledResponsiveContainer = styled(ResponsiveContainer)`
    /* tick labels */
    tspan {
        ${Typography.label.small};
    }
    /* axis lines */
    .recharts-cartesian-axis > line {
        stroke: ${Colors.background.sub};
    }
    /* legend spacing */
    .recharts-default-legend {
        display: flex;
        justify-content: space-between;
    }
`

interface LineGraphProps {
    graphId: string
}

const LineGraph = ({ graphId }: LineGraphProps) => {
    const { dashboard, selectedInterval } = useSuperDashboardContext()
    const startDate = DateTime.fromFormat(selectedInterval.date_start, 'yyyy-MM-dd')
    const endDate = DateTime.fromFormat(selectedInterval.date_end, 'yyyy-MM-dd')

    const ticks = useMemo(() => {
        return Array.from({ length: DAYS_PER_WEEK }).map((_, i) => startDate.plus({ days: i }).toUnixInteger())
    }, [startDate])

    return (
        <StyledResponsiveContainer height={GRAPH_HEIGHT}>
            <LineChart margin={{ top: GRAPH_TOP_MARGIN, right: GRAPH_RIGHT_MARGIN }}>
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
                <Legend iconType="circle" formatter={(value) => <BodyMedium color="muted">{value}</BodyMedium>} />
                {dashboard.graphs[graphId].lines.map((line) => (
                    <Fragment key={line.data_id}>
                        <Line
                            name={line.name}
                            dataKey="y"
                            fill={getLineColor(line.color)}
                            type="monotoneX"
                            data={dashboard.data[selectedInterval.id]?.[line.data_id]?.points ?? []}
                            stroke={getLineColor(line.color)}
                            strokeWidth={LINE_STROKE_WIDTH}
                            animationDuration={LINE_ANIMATION_DURATION}
                        />
                        {dashboard.data[selectedInterval.id]?.[line.data_id]?.aggregated_value !== undefined && (
                            <ReferenceLine
                                y={dashboard.data[selectedInterval.id][line.data_id].aggregated_value}
                                stroke={getLineColor(line.color)}
                                strokeDasharray={STROKE_DASH_ARRAY}
                                strokeWidth={LINE_STROKE_WIDTH}
                            />
                        )}
                    </Fragment>
                ))}
            </LineChart>
        </StyledResponsiveContainer>
    )
}

export default LineGraph
