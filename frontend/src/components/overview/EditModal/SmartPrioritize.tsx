import { useState } from 'react'
import styled from 'styled-components'
import {
    TOverviewSuggestion,
    getOverviewSmartSuggestion,
    useSmartPrioritizationSuggestionsRemaining,
} from '../../../services/api/overview.hooks'
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
    const [suggestion, setSuggestion] = useState<TOverviewSuggestion>()

    const getSuggestion = async () => {
        setState(SmartPrioritizeState.LOADING)
        try {
            const suggestion = await getOverviewSmartSuggestion()
            setSuggestion(suggestion)
            setState(SmartPrioritizeState.LOADED)
        } catch (e) {
            setState(SmartPrioritizeState.ERROR)
        }
    }

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
                        <GTButton
                            size="small"
                            value="Enable"
                            onClick={getSuggestion}
                            disabled={suggestionsRemaining === 0}
                        />
                        <Mini color="light">
                            {suggestionsRemaining === 0
                                ? 'No more uses remaining today'
                                : `${suggestionsRemaining} uses remaining today`}
                        </Mini>
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
                return (
                    <Flex gap={Spacing._16} alignItems="center" justifyContent="center">
                        <Icon icon={icons.warning} color="red" />
                        <Label color="red">There was an error sorting your lists. Please try again.</Label>
                        <GTButton
                            size="small"
                            value="Cancel"
                            styleType="secondary"
                            onClick={() => setState(SmartPrioritizeState.MANUAL)}
                        />
                        <GTButton size="small" value="Retry" onClick={getSuggestion} />
                    </Flex>
                )
            case SmartPrioritizeState.LOADED:
                return <div>loaded{JSON.stringify(suggestion)}</div>
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
