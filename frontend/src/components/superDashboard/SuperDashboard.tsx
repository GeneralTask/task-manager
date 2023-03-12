import { Spacing } from '../../styles'
import Flex from '../atoms/Flex'
import Metric from './Metric'
import dummyAPIReponse from './dummyData'

const SuperDashboard = () => {
    const data = dummyAPIReponse.metrics
    return (
        <Flex gap={Spacing._24}>
            {data.map((metric) => (
                <Metric key={metric.name} metric={metric} />
            ))}
        </Flex>
    )
}

export default SuperDashboard
