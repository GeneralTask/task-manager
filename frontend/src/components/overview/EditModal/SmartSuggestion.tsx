import { Fragment, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useGTLocalStorage } from '../../../hooks'
import { TOverviewSuggestion, useBulkModifyViews } from '../../../services/api/overview.hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon, TIconType } from '../../atoms/Icon'
import { Divider } from '../../atoms/SectionDivider'
import GTButton from '../../atoms/buttons/GTButton'
import { getOverviewAccordionHeaderIcon } from '../AccordionItem'
import useOverviewLists from '../useOverviewLists'

const TopButtons = styled(Flex)`
    margin-top: ${Spacing._16};
`
const Suggestion = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${Spacing._16} 0;
    gap: ${Spacing._16};
    width: 100%;
`
const ListContainer = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${Spacing._16};
    box-sizing: border-box;
    height: fit-content;
    flex: 1;
    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.deprecated_button.default};
    border-radius: ${Border.radius.small};
`
const Reasoning = styled.span`
    ${Typography.label};
    width: 300px;
    color: ${Colors.text.light};
`

interface SmartSuggestionProps {
    suggestions: TOverviewSuggestion[]
    onRevertToManual: () => void
}
const SmartSuggestion = ({ suggestions, onRevertToManual }: SmartSuggestionProps) => {
    const [isSaved, setIsSaved] = useState(false)
    const { lists } = useOverviewLists()
    const [initialLists] = useState(lists) // saves initial lists to revert back to
    const { mutate: bulkModifyViews } = useBulkModifyViews()
    const [, setIsUsingSmartPrioritization] = useGTLocalStorage('isUsingSmartPrioritization', false, true)

    const idToList = useMemo(() => new Map(lists.map((list) => [list.id, list])), [lists])

    const handleSaveSuggestion = () => {
        setIsSaved(true)
        setIsUsingSmartPrioritization(true)
        bulkModifyViews({
            ordered_view_ids: suggestions.map((suggestion) => suggestion.id),
        })
    }

    const handleRevertToManual = () => {
        if (isSaved) {
            bulkModifyViews({
                ordered_view_ids: initialLists.map((list) => list.id),
            })
        }
        onRevertToManual()
    }

    const getPriority = (index: number): { icon: TIconType; color: TIconColor } => {
        if (index === 0) return { icon: icons.priority_urgent, color: 'red' }
        else if (index === suggestions.length - 1) return { icon: icons.priority_low, color: 'green' }
        else if (index === 1 && suggestions.length > 4) return { icon: icons.priority_high, color: 'yellow' }
        else return { icon: icons.priority_medium, color: 'blue' }
    }

    const List = ({ id, index }: { id: string; index: number }) => {
        const list = idToList.get(id)
        if (!list) return null
        const { icon, color } = getPriority(index)
        return (
            <ListContainer>
                <Flex alignItems="center" gap={Spacing._16}>
                    <Icon icon={getOverviewAccordionHeaderIcon(list.logo)} />
                    {list.name}
                </Flex>
                <Flex alignItems="center">
                    <Icon icon={icon} color={color} />
                </Flex>
            </ListContainer>
        )
    }

    return (
        <>
            <TopButtons justifyContent="space-between" alignItems="center">
                <GTButton
                    size="small"
                    value={
                        isSaved ? (
                            <Flex alignItems="center" gap={Spacing._8}>
                                <span>Saved</span>
                                <Icon icon={icons.check} color="white" />
                            </Flex>
                        ) : (
                            'Save'
                        )
                    }
                    onClick={handleSaveSuggestion}
                    disabled={isSaved}
                />
                <GTButton
                    size="small"
                    value="Revert to manual sorting"
                    styleType="secondary"
                    onClick={handleRevertToManual}
                />
            </TopButtons>
            {suggestions.map(({ id, reasoning }, index) => (
                <Fragment key={id}>
                    <Suggestion>
                        <List id={id} index={index} />
                        <Reasoning>{reasoning}</Reasoning>
                    </Suggestion>
                    {index !== suggestions.length - 1 && <Divider color={Colors.background.border} />}
                </Fragment>
            ))}
        </>
    )
}

export default SmartSuggestion
