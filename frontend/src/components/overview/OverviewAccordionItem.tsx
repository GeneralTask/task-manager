import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useParams } from 'react-router-dom'
import * as Accordion from '@radix-ui/react-accordion'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID } from '../../constants'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { TLogoImage, icons, logos } from '../../styles/images'
import { DropType, TOverviewView } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import Spinner from '../atoms/Spinner'
import StatusLabel from '../atoms/StatusLabel'
import { Body, Label } from '../atoms/typography/Typography'
import { MenuTriggerShared } from '../radix/RadixUIConstants'
import { PAGE_SIZE } from './OverviewViewContainer'
import { OptimisticItemsContainer, PaginateTextButton } from './styles'
import DueTodayViewItems from './viewItems/DueTodayViewItems'
import ExternalViewItems from './viewItems/ExternalViewItems'
import MeetingPreparationViewItems from './viewItems/MeetingPreparationViewItems'
import PullRequestViewItems from './viewItems/PullRequestViewItems'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'

const AccordionTrigger = styled(Accordion.Trigger)`
    ${MenuTriggerShared};
    outline: none !important;
    user-select: none;
    width: 100%;
    box-sizing: border-box;
    background-color: ${Colors.background.white};
    padding: ${Spacing._16};
    display: flex;
    justify-content: space-between;
    border-radius: ${Border.radius.small};
    &[data-state='open'] {
        border-radius: ${Border.radius.small} ${Border.radius.small} 0 0;
    }
    cursor: pointer;
    &[data-state='open'] > div > .AccordionChevron {
        transform: rotate(180deg);
    }
    box-shadow: ${Shadows.button.default};
`
const StyledFlex = styled(Flex)`
    width: 100%;
`
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
const ListContent = styled.div`
    padding: ${Spacing._16};
    background-color: ${Colors.background.white};
    border-radius: 0 0 ${Border.radius.small} ${Border.radius.small};
    box-shadow: ${Shadows.button.default};
`

export const getOverviewAccordionHeaderIcon = (logo: TLogoImage, sectionId?: string) => {
    if (logo !== 'generaltask') return logos[logo]
    return sectionId === DEFAULT_SECTION_ID ? icons.inbox : icons.folder
}

interface OverviewAccordionItemProps {
    list: TOverviewView
    closeAccordion: () => void
}
const OverviewAccordionItem = ({ list, closeAccordion }: OverviewAccordionItemProps) => {
    const [visibleItemsCount, setVisibleItemsCount] = useState(0)
    const nextPageLength = Math.min(list.view_items.length - visibleItemsCount, PAGE_SIZE)
    const { overviewViewId, overviewItemId } = useParams()

    const [, drag, dragPreview] = useDrag(() => ({
        type: DropType.OVERVIEW_VIEW_HEADER,
        item: { view: list },
    }))

    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true })
    }, [dragPreview])

    useEffect(() => {
        if (list.view_items.length === 0) closeAccordion()
    }, [list.view_items.length])

    useLayoutEffect(() => {
        setVisibleItemsCount(
            Math.max(
                // Ensure that visibleItemsCount <= view.view_items.length, and that we do not decrease the number of visible items when selecting a new item
                Math.min(visibleItemsCount, list.view_items.length),
                // If view.view_items.length drops below PAGE_SIZE, set visibleItemsCount to view.view_items.length
                Math.min(list.view_items.length, PAGE_SIZE),
                // if the selected item is in this view, ensure it is visible
                list.id === overviewViewId ? list.view_items.findIndex((item) => item.id === overviewItemId) + 1 : 0
            )
        )
    }, [list.is_linked, list.view_items, overviewViewId, overviewItemId])

    const ViewItems = useMemo(() => {
        if (list.optimisticId) {
            return () => (
                <OptimisticItemsContainer>
                    <Spinner />
                </OptimisticItemsContainer>
            )
        }
        switch (list.type) {
            case 'task_section':
                return TaskSectionViewItems
            case 'linear':
            case 'slack':
                return ExternalViewItems
            case 'github':
                return PullRequestViewItems
            case 'meeting_preparation':
                return MeetingPreparationViewItems
            case 'due_today':
                return DueTodayViewItems
            default:
                return () => <div>[WIP]List of items for type {list.type}</div>
        }
    }, [list.type])

    return (
        <Accordion.Item value={list.id} key={list.id}>
            <Accordion.Header>
                <AccordionTrigger>
                    <StyledFlex ref={drag} justifyContent="space-between">
                        <TriggerTitle>
                            <Icon
                                icon={getOverviewAccordionHeaderIcon(list.logo, list.task_section_id)}
                                color={list.view_items.length === 0 ? 'gray' : 'black'}
                            />
                            <ListTitle isComplete={list.view_items.length === 0 && list.is_linked}>
                                {list.name}
                            </ListTitle>
                        </TriggerTitle>
                        <TriggerRightContainer>
                            {list.view_items.length > 0 && (
                                <ItemsRemainingText>{list.view_items.length} remaining</ItemsRemainingText>
                            )}
                            {list.view_items.length === 0 && list.is_linked && (
                                <StatusLabel
                                    status={list.has_tasks_completed_today ? 'List complete' : 'Empty'}
                                    color={list.has_tasks_completed_today ? 'green' : 'gray'}
                                    icon={icons.check}
                                />
                            )}
                            <Icon icon={icons.caret_down} className="AccordionChevron" />
                        </TriggerRightContainer>
                    </StyledFlex>
                </AccordionTrigger>
            </Accordion.Header>
            <Accordion.Content>
                <ListContent>
                    <ViewItems view={list} visibleItemsCount={visibleItemsCount} hideHeader />
                    {visibleItemsCount < list.view_items.length && (
                        <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                            View more ({nextPageLength})
                        </PaginateTextButton>
                    )}
                </ListContent>
            </Accordion.Content>
        </Accordion.Item>
    )
}

export default OverviewAccordionItem
