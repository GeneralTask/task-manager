import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TOverviewView } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import Spinner from '../atoms/Spinner'
import StatusLabel from '../atoms/StatusLabel'
import { Body, Label } from '../atoms/typography/Typography'
import { getCorrectlyOrderedOverviewLists } from '../views/DailyOverviewView'
import { getOverviewAccordionHeaderIcon } from './OverviewAccordionItem'
import { PAGE_SIZE } from './OverviewViewContainer'
import { OptimisticItemsContainer, PaginateTextButton } from './styles'
import DueTodayViewItems from './viewItems/DueTodayViewItems'
import ExternalViewItems from './viewItems/ExternalViewItems'
import MeetingPreparationViewItems from './viewItems/MeetingPreparationViewItems'
import PullRequestViewItems from './viewItems/PullRequestViewItems'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'

const Trigger = styled.div<{ isOpen: boolean }>`
    outline: none !important;
    user-select: none;
    width: 100%;
    box-sizing: border-box;
    background-color: ${Colors.background.white};
    padding: ${Spacing._16};
    display: flex;
    justify-content: space-between;
    border-radius: ${Border.radius.small};
    ${(props) => props.isOpen && `border-radius: ${Border.radius.small} ${Border.radius.small} 0 0;`}
    cursor: pointer;
    box-shadow: ${Shadows.button.default};
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
const StyledFlex = styled(Flex)`
    width: 100%;
`
const ListContent = styled.div`
    padding: ${Spacing._16};
    background-color: ${Colors.background.white};
    border-radius: 0 0 ${Border.radius.small} ${Border.radius.small};
    box-shadow: ${Shadows.button.default};
`

interface AccordionHeaderProps {
    list: TOverviewView
    isOpen: boolean
}
const AccordionHeader = ({ list, isOpen }: AccordionHeaderProps) => {
    return (
        <StyledFlex justifyContent="space-between">
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
                {list.view_items.length === 0 && list.is_linked && (
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

const useGetViewItems = (list: TOverviewView) => {
    return useMemo(() => {
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
}

const useGetVisibleItemCount = (list: TOverviewView, listID: string) => {
    const [visibleItemsCount, setVisibleItemsCount] = useState(0)
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
    }, [list.is_linked, list.view_items, listID, overviewItemId])
    return [visibleItemsCount, setVisibleItemsCount] as const
}

interface GTAccordionItemProps {
    list: TOverviewView
    openListIds: string[]
    setOpenListIds: (ids: string[]) => void
}
const GTAccordionItem = ({ list, openListIds, setOpenListIds }: GTAccordionItemProps) => {
    const ViewItems = useGetViewItems(list)
    const isOpen = openListIds.includes(list.id)
    const toggerAccordion = () => {
        if (isOpen) setOpenListIds(openListIds.filter((id) => id !== list.id))
        else setOpenListIds([...openListIds, list.id])
    }

    const [visibleItemsCount, setVisibleItemsCount] = useGetVisibleItemCount(list, list.id)
    const nextPageLength = Math.min(list.view_items.length - visibleItemsCount, PAGE_SIZE)
    const { lists } = getCorrectlyOrderedOverviewLists()
    // const [prevList, setPrevList] = useState<TOverviewView[] | null>(null)

    useEffect(() => {
        console.log('weeeee')
        if (!openListIds.includes(list.id)) return
        console.log('did include it')
        if (list.view_items.length === 0) {
            console.log('list is empty')
            const listWithItRemoved = openListIds.filter((id) => id !== list.id)

            const currentIndex = lists.findIndex((l) => l.id === list.id)
            console.log('currentIndex', currentIndex)
            if (currentIndex === -1 || currentIndex === lists.length - 1) return
            const nextList = lists[currentIndex + 1]
            console.log(nextList.name)
            listWithItRemoved.push(nextList.id)
            setOpenListIds(listWithItRemoved)
        }
    }, [list.view_items.length])

    return (
        <div style={{ marginBottom: '8px' }}>
            <Trigger onClick={toggerAccordion} isOpen={isOpen}>
                <AccordionHeader list={list} isOpen={isOpen} />
            </Trigger>
            {isOpen && (
                <ListContent>
                    <ViewItems view={list} visibleItemsCount={visibleItemsCount} hideHeader />
                    {visibleItemsCount < list.view_items.length && (
                        <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                            View more ({nextPageLength})
                        </PaginateTextButton>
                    )}
                </ListContent>
            )}
        </div>
    )
}

export default GTAccordionItem
