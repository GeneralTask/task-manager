import { useLayoutEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as Accordion from '@radix-ui/react-accordion'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TOverviewView } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import Spinner from '../atoms/Spinner'
import { Body, Label } from '../atoms/typography/Typography'
import { PAGE_SIZE } from '../overview/OverviewViewContainer'
import { OptimisticItemsContainer, PaginateTextButton } from '../overview/styles'
import DueTodayViewItems from '../overview/viewItems/DueTodayViewItems'
import ExternalViewItems from '../overview/viewItems/ExternalViewItems'
import MeetingPreparationViewItems from '../overview/viewItems/MeetingPreparationViewItems'
import PullRequestViewItems from '../overview/viewItems/PullRequestViewItems'
import TaskSectionViewItems from '../overview/viewItems/TaskSectionViewItems'
import { MenuTriggerShared } from './RadixUIConstants'

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
const TriggerTitle = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._16};
`
const TriggerRightContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._16};
`
const ListContent = styled.div`
    padding: ${Spacing._16};
    background-color: ${Colors.background.white};
    border-radius: 0 0 ${Border.radius.small} ${Border.radius.small};
    box-shadow: ${Shadows.button.default};
`

interface OverviewAccordionItemProps {
    list: TOverviewView
}
const OverviewAccordionItem = ({ list }: OverviewAccordionItemProps) => {
    const [visibleItemsCount, setVisibleItemsCount] = useState(0)
    const nextPageLength = Math.min(list.view_items.length - visibleItemsCount, PAGE_SIZE)
    const { overviewViewId, overviewItemId } = useParams()

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
                    <TriggerTitle>
                        <Icon icon={logos[list.logo]} />
                        <Body>{list.name}</Body>
                    </TriggerTitle>
                    <TriggerRightContainer>
                        {list.view_items.length > 0 && <Label>{list.view_items.length} remaining</Label>}
                        <Icon icon={icons.caret_down} className="AccordionChevron" />
                    </TriggerRightContainer>
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
