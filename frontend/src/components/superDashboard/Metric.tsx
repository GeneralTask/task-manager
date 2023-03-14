import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Shadows, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { BodyMedium, HeadlineLarge, TitleMedium } from '../atoms/typography/Typography'
import LineGraph from './LineGraph'
import { TMetric } from './types'

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
    metric: TMetric
    startDate: DateTime
}

const Metric = ({ metric, startDate }: MetricProps) => {
    return (
        <Container>
            <Flex alignItems="center" gap={Spacing._8}>
                <Icon icon={icons[metric.icon]} />
                <TitleMedium color="muted">{metric.name}</TitleMedium>
            </Flex>
            <Flex justifyContent="space-between">
                {metric.lines.map((line) => (
                    <Flex key={line.name} column gap={Spacing._8}>
                        <Flex alignItems="center" gap={Spacing._8}>
                            <DashedLine color={line.color} />
                            <BodyMedium>{line.aggregated_name}</BodyMedium>
                        </Flex>
                        {/* convert to minutes and round to one decimal */}
                        <HeadlineLarge>{Math.round((line.aggregated_value / 60) * 10) / 10} hours</HeadlineLarge>
                    </Flex>
                ))}
            </Flex>
            <LineGraph key={metric.name} data={metric} startDate={startDate} />
        </Container>
    )
}

export default Metric
