import styled from 'styled-components'
import { Shadows, Spacing } from '../../styles'
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

interface MetricProps {
    metric: TMetric
}

const Metric = ({ metric }: MetricProps) => {
    return (
        <Container>
            <Flex alignItems="center" gap={Spacing._8}>
                <Icon icon={icons[metric.icon]} />
                <TitleMedium color="muted">{metric.name}</TitleMedium>
            </Flex>
            <Flex justifyContent="space-between">
                {metric.lines.map((line) => (
                    <Flex key={line.name} column gap={Spacing._8}>
                        <BodyMedium>{line.aggregated_name}</BodyMedium>
                        <HeadlineLarge>{line.aggregated_value}</HeadlineLarge>
                    </Flex>
                ))}
            </Flex>
            <LineGraph key={metric.name} data={metric} />
        </Container>
    )
}

export default Metric
