import { useState } from 'react'
import { useQueryClient } from 'react-query'
import styled from 'styled-components'
import { usePreviewMode } from '../../../hooks'
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
import { BodyMedium, BodySmall, LabelSmall } from '../../atoms/typography/Typography'
import Tip from '../../radix/Tip'
import SmartSuggestion from './SmartSuggestion'

const Container = styled.div`
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.medium};
    overflow: hidden;
    margin-bottom: ${Spacing._16};
`
const Description = styled.div`
    padding: ${Spacing._16};
    border-bottom: ${Border.stroke.medium} solid ${Colors.background.border};
`
const Body = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 ${Spacing._16};
    background-color: ${Colors.background.base};
    min-height: ${Spacing._64};
`

export enum SmartPrioritizeState {
    MANUAL,
    LOADING,
    ERROR,
    ERROR_TOO_LONG,
    LOADED,
}

interface SmartPrioritizeProps {
    state: SmartPrioritizeState
    setState: (state: SmartPrioritizeState) => void
}
const SmartPrioritize = ({ state, setState }: SmartPrioritizeProps) => {
    const { isPreviewMode } = usePreviewMode()
    const { data: suggestionsRemaining, isLoading: suggestionsLoading } = useSmartPrioritizationSuggestionsRemaining()
    const hasSuggestionsRemaining = suggestionsRemaining && suggestionsRemaining > 0
    const [suggestions, setSuggestions] = useState<TOverviewSuggestion[]>()
    const queryClient = useQueryClient()

    const getSuggestion = async () => {
        setState(SmartPrioritizeState.LOADING)
        try {
            const suggestion = await getOverviewSmartSuggestion()
            await queryClient.invalidateQueries('overview-suggestions-remaining')
            setSuggestions(suggestion)
            setState(SmartPrioritizeState.LOADED)
        } catch (e) {
            await queryClient.invalidateQueries('overview-suggestions-remaining')
            if (e instanceof Error && e.message === 'prompt is too long for suggestion') {
                setState(SmartPrioritizeState.ERROR_TOO_LONG)
            } else {
                setState(SmartPrioritizeState.ERROR)
            }
        }
    }

    const getBodyContent = () => {
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
                            styleType="primary"
                            value="Enable"
                            onClick={getSuggestion}
                            disabled={!hasSuggestionsRemaining && !isPreviewMode}
                        />
                        <LabelSmall color="light">
                            {hasSuggestionsRemaining
                                ? `${suggestionsRemaining} uses remaining today`
                                : `No more uses remaining today${isPreviewMode ? " (but you're an employee 😎)" : ''}`}
                        </LabelSmall>
                    </Flex>
                )
            case SmartPrioritizeState.LOADING:
                return (
                    <Flex gap={Spacing._16} alignItems="center" justifyContent="center">
                        <RefreshSpinner isRefreshing>
                            <Icon icon={icons.gear} />
                        </RefreshSpinner>
                        <BodySmall>Prioritizing your lists...</BodySmall>
                    </Flex>
                )
            case SmartPrioritizeState.ERROR:
                return (
                    <Flex gap={Spacing._16} alignItems="center" justifyContent="center">
                        <Icon icon={icons.warningTriangle} color="red" />
                        <BodySmall color="red">
                            There was an error sorting your lists.
                            {hasSuggestionsRemaining
                                ? ` Please try again. (${suggestionsRemaining} uses remaining)`
                                : null}
                        </BodySmall>
                        <GTButton
                            value="Cancel"
                            styleType="secondary"
                            onClick={() => setState(SmartPrioritizeState.MANUAL)}
                        />
                        {hasSuggestionsRemaining || isPreviewMode ? (
                            <GTButton styleType="primary" value="Retry" onClick={getSuggestion} />
                        ) : (
                            <GTButton
                                styleType="primary"
                                value="Retry"
                                onClick={getSuggestion}
                                disabled
                                tooltipText="You have no uses remaining"
                            />
                        )}
                    </Flex>
                )
            case SmartPrioritizeState.ERROR_TOO_LONG:
                return (
                    <Flex gap={Spacing._16} alignItems="center" justifyContent="center">
                        <Icon icon={icons.warningTriangle} color="red" />
                        <Flex column justifyContent="center">
                            <BodySmall color="red">
                                Some of your lists are too long to be prioritized. Try removing items from your Daily
                                Overview.
                            </BodySmall>
                            <BodySmall color="red">
                                {hasSuggestionsRemaining ? ` (${suggestionsRemaining} uses remaining)` : null}
                            </BodySmall>
                        </Flex>
                        <Flex gap={Spacing._16} alignItems="center" justifyContent="center">
                            <GTButton
                                value="Cancel"
                                styleType="secondary"
                                onClick={() => setState(SmartPrioritizeState.MANUAL)}
                            />
                            {hasSuggestionsRemaining || isPreviewMode ? (
                                <GTButton styleType="primary" value="Retry" onClick={getSuggestion} />
                            ) : (
                                <Tip content="You have no uses remaining">
                                    <GTButton styleType="primary" value="Retry" onClick={getSuggestion} disabled />
                                </Tip>
                            )}
                        </Flex>
                    </Flex>
                )
            case SmartPrioritizeState.LOADED:
                if (!suggestions) return null
                return (
                    <SmartSuggestion
                        suggestions={suggestions}
                        onRevertToManual={() => setState(SmartPrioritizeState.MANUAL)}
                    />
                )
        }
    }
    return (
        <Container>
            <Description>
                <Flex gap={Spacing._8} alignItems="center">
                    <Icon icon={icons.bolt} />
                    <BodyMedium>
                        Smart Prioritize<sup>AI</sup> (Alpha)
                    </BodyMedium>
                </Flex>
                <BodySmall color="light">
                    Using AI, Smart Prioritize helps you focus on your most important work by organizing your lists
                    based on effectiveness. Please note Smart Prioritize can be used up to three times a day and is
                    currently in Alpha testing.
                </BodySmall>
            </Description>
            <Body>{getBodyContent()}</Body>
        </Container>
    )
}

export default SmartPrioritize
