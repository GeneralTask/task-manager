import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { LabelSmall } from '../atoms/typography/Typography'

const Container = styled.div`
    display: flex;
    gap: ${Spacing._8};
    color: ${Colors.text.muted};
    align-items: center;
`
const ColoredCircle = styled.div<{ color: string }>`
    background-color: ${(props) => props.color};
    width: 12px;
    height: 12px;
    border-radius: 50%;
`
const CompletionLegend = () => {
    const colorIntensityHex = ['40', '80', 'FF']
    return (
        <Container>
            <LabelSmall>Less</LabelSmall>
            {colorIntensityHex.map((hex) => (
                <ColoredCircle key={hex} color={`${Colors.accent.yellow}${hex}`} />
            ))}
            <LabelSmall>More</LabelSmall>
        </Container>
    )
}

export default CompletionLegend
