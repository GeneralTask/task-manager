import styled from 'styled-components'
import { Spacing } from '../../../styles'
import Flex from '../../atoms/Flex'
import DateSelector from './DateSelector'
import Metric from './Metric'
import SubjectSelector from './SubjectSelector'
import { useSuperDashboardContext } from './SuperDashboardContext'
import TeamRoster from './teamRoster'

const Metrics = styled.div`
    display: flex;
    gap: ${Spacing._24};
    flex-wrap: wrap;
    width: 100%;
`

const SuperDashboard = () => {
    const { selectedSubject } = useSuperDashboardContext()

    return (
        <Flex column gap={Spacing._24}>
            <Flex justifyContent="space-between" alignItems="center">
                <DateSelector />
                <Flex alignItems="center" gap={Spacing._16}>
                    <SubjectSelector />
                    <TeamRoster />
                </Flex>
            </Flex>
            <Metrics>
                {selectedSubject.graph_ids.map((graphId) => (
                    <Metric key={graphId} graphId={graphId} />
                ))}
            </Metrics>
        </Flex>
    )
}

export default SuperDashboard
