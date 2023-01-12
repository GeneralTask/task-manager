import styled from 'styled-components'
import { useSmartPrioritizationSuggestionsRemaining } from '../../../services/api/overview.hooks'
import { Border, Colors, Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'
import RefreshSpinner from '../../atoms/buttons/RefreshSpinner'
import { BodySmall, Label, Mini } from '../../atoms/typography/Typography'

const Container = styled.div`
    border: ${Border.stroke.medium} solid ${Colors.border.light};
    border-radius: ${Border.radius.small};
    overflow: hidden;
    margin-bottom: ${Spacing._16};
`
const Description = styled.div`
    padding: ${Spacing._16};
    border-bottom: ${Border.stroke.medium} solid ${Colors.border.light};
`
const Body = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 ${Spacing._16};
    background-color: ${Colors.background.light};
    min-height: ${Spacing._64};
`

export enum SmartPrioritizeState {
    MANUAL,
    LOADING,
    ERROR,
    LOADED,
}

interface SmartPrioritizeProps {
    state: SmartPrioritizeState
    setState: (state: SmartPrioritizeState) => void
}
const SmartPrioritize = ({ state, setState }: SmartPrioritizeProps) => {
    const { data: suggestionsRemaining, isLoading: suggestionsLoading } = useSmartPrioritizationSuggestionsRemaining()
    const BodyContent = () => {
        if (suggestionsLoading) {
            return (
                <Flex justifyContent="center">
                    <RefreshSpinner isRefreshing>
                        <Icon icon={icons.spinner} />
                    </RefreshSpinner>
                </Flex>
            )
        }
        switch (state) {
            case SmartPrioritizeState.MANUAL:
                return (
                    <Flex gap={Spacing._16} alignItems="center">
                        <GTButton size="small" value="Enable" onClick={() => setState(SmartPrioritizeState.LOADING)} />
                        <Mini color="light">{suggestionsRemaining} uses remaining today</Mini>
                    </Flex>
                )
            case SmartPrioritizeState.LOADING:
                return (
                    <Flex gap={Spacing._16} alignItems="center" justifyContent="center">
                        <Icon icon={icons.gear} />
                        <Label>Prioritizing your lists...</Label>
                    </Flex>
                )
            case SmartPrioritizeState.ERROR:
                return <div>Error</div>
            case SmartPrioritizeState.LOADED:
                return <div>Loaded</div>
        }
    }
    return (
        <Container>
            <Description>
                <Flex gap={Spacing._8} alignItems="center">
                    <Icon icon={icons.bolt} />
                    <BodySmall>
                        Smart Prioritize<sup>AI</sup>
                    </BodySmall>
                </Flex>
                <Mini color="light">
                    Using AI, Smart Prioritize helps you focus on your most important work by organizing your lists
                    based on effectiveness. Please note Smart Prioritize can be used up to three times a day and is
                    currently in Alpha testing.
                </Mini>
            </Description>
            <Body>
                <BodyContent />
            </Body>
        </Container>
    )
}

export default SmartPrioritize
