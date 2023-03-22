import styled from 'styled-components'
import { Border, Shadows, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { BodyMedium, HeadlineLarge, TitleMedium } from '../atoms/typography/Typography'
import LineGraph from './LineGraph'
import { useSuperDashboardContext } from './SuperDashboardContext'
import { getLineColor } from './utils'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${Spacing._24};
    gap: ${Spacing._24};
    box-shadow: ${Shadows.m};
    box-sizing: border-box;
    width: 100%;
    @media (min-width: 1000px) {
        width: calc(50% - ${Spacing._24}); // 24px gap between metrics
    }
`
const DashedLine = styled.div<{ color: string }>`
    border: ${Border.stroke.medium} dashed ${({ color }) => color};
    height: 0%;
    width: ${Spacing._8};
`

interface MetricProps {
    graphId: string
}

const Metric = ({ graphId }: MetricProps) => {
    const { dashboard, selectedInterval, selectedSubject } = useSuperDashboardContext()
    const graph = dashboard.graphs[graphId]
    return (
        <Container>
            <Flex alignItems="center" gap={Spacing._8}>
                <Icon icon={icons[graph.icon]} />
                <TitleMedium color="muted">{graph.name}</TitleMedium>
            </Flex>
            <Flex justifyContent="space-between">
                {graph.lines.map((line) => (
                    <Flex key={line.data_id} column gap={Spacing._8}>
                        <Flex alignItems="center" gap={Spacing._8}>
                            <DashedLine color={getLineColor(line.color)} />
                            <BodyMedium>{line.aggregated_name}</BodyMedium>
                        </Flex>
                        {/* convert to minutes and round to one decimal */}
                        <HeadlineLarge>
                            {dashboard.data[line.subject_id_override || selectedSubject.id]?.[selectedInterval.id]?.[
                                line.data_id
                            ]?.aggregated_value !== undefined
                                ? `${(
                                      dashboard.data[line.subject_id_override || selectedSubject.id][
                                          selectedInterval.id
                                      ][line.data_id].aggregated_value / 60
                                  ).toFixed(1)} hours`
                                : 'N/A'}
                        </HeadlineLarge>
                    </Flex>
                ))}
            </Flex>
            <LineGraph graphId={graphId} />
        </Container>
    )
}

export default Metric
