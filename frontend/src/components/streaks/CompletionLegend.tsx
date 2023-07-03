import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { LabelSmall } from '../atoms/typography/Typography'

const COLOR_INTENSITY_HEX = ['40', '80', 'FF']

const Container = styled.div`
    display: flex;
    gap: ${Spacing._8};
    color: ${Colors.text.muted};
    align-items: center;
`
const ColoredCircle = styled.div<{ color: string }>`
    background-color: ${(props) => props.color};
    width: ${Spacing._12};
    height: ${Spacing._12};
    border-radius: 50%;
`
const CompletionLegend = () => {
    return (
        <Container>
            <LabelSmall>Less</LabelSmall>
            {COLOR_INTENSITY_HEX.map((hex) => (
                <ColoredCircle key={hex} color={`${Colors.accent.yellow}${hex}`} />
            ))}
            <LabelSmall>More</LabelSmall>
        </Container>
    )
}

export default CompletionLegend
