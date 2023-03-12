import { useState } from 'react'
import { Spacing } from '../../styles'
import Flex from '../atoms/Flex'
import Metric from './Metric'
import dummyAPIReponse from './dummyData'
import { TDashboardView } from './types'

const SuperDashboard = () => {
    const data = dummyAPIReponse
    const [selectedView] = useState<TDashboardView>(data[0])

    return (
        <Flex gap={Spacing._24}>
            {selectedView.metrics.map((metric) => (
                <Metric key={metric.name} metric={metric} />
            ))}
        </Flex>
    )
}

export default SuperDashboard
