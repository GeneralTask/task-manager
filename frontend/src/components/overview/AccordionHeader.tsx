import { useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { DropType, TOverviewView } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import StatusLabel from '../atoms/StatusLabel'
import { Body, Label } from '../atoms/typography/Typography'
import { getOverviewAccordionHeaderIcon } from './AccordionItem'

const TriggerTitle = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._16};
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: ${Spacing._8};
    white-space: nowrap;
`
const ListTitle = styled(Body)<{ isComplete: boolean }>`
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    ${Typography.bold}
    ${(props) =>
        props.isComplete &&
        `
        text-decoration: line-through;
        color: ${Colors.text.light};
    `}
`
const TriggerRightContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._16};
`
const ItemsRemainingText = styled(Label)`
    white-space: nowrap;
`
const StyledFlex = styled(Flex)`
    width: 100%;
`

interface AccordionHeaderProps {
    list: TOverviewView
    isOpen: boolean
}
const AccordionHeader = ({ list, isOpen }: AccordionHeaderProps) => {
    const [, drag, dragPreview] = useDrag(() => ({
        type: DropType.OVERVIEW_VIEW_HEADER,
        item: { view: list },
    }))

    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true })
    }, [dragPreview])

    return (
        <StyledFlex justifyContent="space-between" ref={drag}>
            <TriggerTitle>
                <Icon
                    icon={getOverviewAccordionHeaderIcon(list.logo, list.task_section_id)}
                    color={list.view_items.length === 0 ? 'gray' : 'black'}
                />
                <ListTitle isComplete={list.view_items.length === 0 && list.is_linked}>{list.name}</ListTitle>
            </TriggerTitle>
            <TriggerRightContainer>
                {list.view_items.length > 0 && (
                    <ItemsRemainingText>{list.view_items.length} remaining</ItemsRemainingText>
                )}
                {list.view_items.length === 0 && list.is_linked && list.has_tasks_completed_today !== undefined && (
                    <StatusLabel
                        status={list.has_tasks_completed_today ? 'List complete' : 'Empty'}
                        color={list.has_tasks_completed_today ? 'green' : 'gray'}
                        icon={icons.check}
                    />
                )}
                <Icon icon={isOpen ? icons.caret_up : icons.caret_down} className="AccordionChevron" />
            </TriggerRightContainer>
        </StyledFlex>
    )
}

export default AccordionHeader
