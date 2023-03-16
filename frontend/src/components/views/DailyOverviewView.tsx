import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useOverviewContext from '../../context/OverviewContextProvider'
import { useGetMeetingPreparationTasks } from '../../services/api/meeting-preparation-tasks.hooks'
import { icons } from '../../styles/images'
import ActionsContainer from '../atoms/ActionsContainer'
import Flex from '../atoms/Flex'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import { Header } from '../molecules/Header'
import AccordionItem from '../overview/AccordionItem'
import EditModal from '../overview/EditModal'
import OverviewDetails from '../overview/OverviewDetails'
import SmartPrioritizationBanner from '../overview/SmartPrioritizationBanner'
import useOverviewLists from '../overview/useOverviewLists'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const useSelectFirstItemOnFirstLoad = () => {
    const { setOpenListIds } = useOverviewContext()
    const { lists, isSuccess } = useOverviewLists()
    const isFirstSuccess = useRef(true)
    const navigate = useNavigate()

    useEffect(() => {
        if (!isFirstSuccess.current || lists?.length === 0) return
        const firstNonEmptyView = lists?.find((list) => list.view_item_ids.length > 0)
        if (firstNonEmptyView) {
            setOpenListIds((ids) => {
                if (!ids.includes(firstNonEmptyView.id)) {
                    return [...ids, firstNonEmptyView.id]
                }
                return ids
            })
            navigate(`/overview/${firstNonEmptyView.id}/${firstNonEmptyView.view_item_ids[0]}`, { replace: true })
        } else {
            navigate(`/overview`, { replace: true })
        }
        isFirstSuccess.current = false
    }, [lists, isSuccess])
}

const DailyOverviewView = () => {
    const [isEditListsModalOpen, setIsEditListsModalOpen] = useState(false)
    const [editListTabIndex, setEditListTabIndex] = useState(0) // 0 - add, 1 - reorder

    const { calendarType } = useCalendarContext()
    useSelectFirstItemOnFirstLoad()
    const { expandAll, collapseAll } = useOverviewContext()

    const { lists, isLoading: isOverviewListsLoading } = useOverviewLists()
    const { isLoading: isMeetingTasksLoading } = useGetMeetingPreparationTasks()

    if (isOverviewListsLoading || isMeetingTasksLoading) return <Spinner />
    return (
        <>
            <Flex>
                <ScrollableListTemplate>
                    <Header folderName="Daily Overview" />
                    <ActionsContainer
                        leftActions={
                            <GTButton
                                styleType="control"
                                onClick={() => {
                                    setEditListTabIndex(1)
                                    setIsEditListsModalOpen(true)
                                }}
                                icon={icons.bolt}
                                iconColor="gray"
                                value={
                                    <span>
                                        Smart Prioritize<sup>AI</sup>
                                    </span>
                                }
                            />
                        }
                        rightActions={
                            <>
                                <GTButton
                                    styleType="control"
                                    onClick={collapseAll}
                                    icon={icons.squareMinus}
                                    iconColor="gray"
                                    value="Collapse all"
                                />
                                <GTButton
                                    styleType="control"
                                    onClick={expandAll}
                                    icon={icons.squarePlus}
                                    iconColor="gray"
                                    value="Expand all"
                                />
                                <GTButton
                                    styleType="control"
                                    onClick={() => {
                                        setEditListTabIndex(0)
                                        setIsEditListsModalOpen(true)
                                    }}
                                    icon={icons.gear}
                                    iconColor="gray"
                                    value="Edit lists"
                                />
                            </>
                        }
                    />
                    <SmartPrioritizationBanner />
                    {lists.map((list) => (
                        <AccordionItem key={list.id} list={list} />
                    ))}
                </ScrollableListTemplate>
            </Flex>
            {calendarType === 'day' && <OverviewDetails />}
            <EditModal
                isOpen={isEditListsModalOpen}
                setisOpen={setIsEditListsModalOpen}
                defaultTabIndex={editListTabIndex}
            />
        </>
    )
}

export default DailyOverviewView
