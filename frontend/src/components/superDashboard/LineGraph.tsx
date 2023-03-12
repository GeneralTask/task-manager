import { DateTime } from 'luxon'
import { CartesianGrid, Legend, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import { TMetric } from './types'

interface LineGraphProps {
    data: TMetric
}

const LineGraph = ({ data }: LineGraphProps) => {
    return (
        <ScatterChart width={730} height={250}>
            <CartesianGrid />
            <XAxis
                dataKey="x"
                type="number"
                scale="time"
                domain={['auto', 'auto']}
                tickFormatter={(unixTime) => DateTime.fromSeconds(unixTime).toFormat('MM/dd')}
            />
            <YAxis dataKey="y" type="number" name="hours" domain={[0, 'auto']} />
            <Legend />
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
    )
}

export default LineGraph
