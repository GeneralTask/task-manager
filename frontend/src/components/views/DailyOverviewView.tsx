import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as Accordion from '@radix-ui/react-accordion'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TPullRequest, TTask } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import TaskDetails from '../details/TaskDetails'
import { SectionHeader } from '../molecules/Header'
import useOverviewLists from '../overview/useOverviewLists'
import OverviewAccordionItem from '../radix/OverviewAccordionItem'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const ActionsContainer = styled.div`
    background-color: ${Colors.background.medium};
    padding: ${Spacing._8} ${Spacing._12};
    border-radius: ${Border.radius.mini};
    display: flex;
    gap: ${Spacing._24};
    margin-bottom: ${Spacing._16};
`
const AccordionRoot = styled(Accordion.Root)`
    > * > h3 {
        all: unset;
    }
    > div {
        margin-bottom: ${Spacing._4};
    }
`

const DailyOverviewView = () => {
    const { lists } = useOverviewLists()
    const [values, setValues] = useState<string[]>([])
    const { overviewViewId, overviewItemId, subtaskId } = useParams()

    const detailsView = useMemo(() => {
        if (lists.length === 0) return <EmptyDetails icon={icons.list} text="You have no views" />
        for (const list of lists) {
            if (list.id !== overviewViewId) continue
            for (const item of list.view_items) {
                if (item.id !== overviewItemId) continue
                if (list.type === 'github') return <PullRequestDetails pullRequest={item as TPullRequest} />

                const subtask = item?.sub_tasks?.find((subtask) => subtask.id === subtaskId)
                const detailsLink = subtask
                    ? `/daily-overview/${list.id}/${item.id}/${subtask.id}`
                    : `/daily-overview/${list.id}/${item.id}`
                return <TaskDetails task={item as TTask} subtask={subtask} link={detailsLink} />
            }
        }
    }, [lists, overviewItemId, overviewViewId, subtaskId])

    const collapseAll = () => setValues([])
    const expandAll = useCallback(() => setValues(lists.map((list) => list.id)), [lists])
    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Daily Overview" />
                <ActionsContainer>
                    <GTButton
                        styleType="simple"
                        size="small"
                        onClick={collapseAll}
                        icon={icons.squareMinus}
                        iconColor="gray"
                        value="Collapse All"
                    />
                    <GTButton
                        styleType="simple"
                        size="small"
                        onClick={expandAll}
                        icon={icons.squarePlus}
                        iconColor="gray"
                        value="Expand All"
                    />
                </ActionsContainer>
                <AccordionRoot type="multiple" value={values} onValueChange={setValues}>
                    {lists.map((list) => (
                        <OverviewAccordionItem key={list.id} list={list} />
                    ))}
                </AccordionRoot>
            </ScrollableListTemplate>
            {detailsView}
        </>
    )
}

export default DailyOverviewView
