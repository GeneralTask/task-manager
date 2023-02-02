import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import { SectionHeader } from '../molecules/Header'
import AccordionItem from '../overview/AccordionItem'
import EditModal from '../overview/EditModal'
import OverviewDetails from '../overview/OverviewDetails'
import SmartPrioritizationBanner from '../overview/SmartPrioritizationBanner'
import useOverviewLists from '../overview/useOverviewLists'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const ActionsContainer = styled.div`
    background-color: ${Colors.background.medium};
    padding: ${Spacing._8} ${Spacing._12};
    border-radius: ${Border.radius.mini};
    display: flex;
    gap: ${Spacing._24};
    margin-bottom: ${Spacing._16};
`
const BannerButton = styled(GTButton)`
    ${Typography.label};
`
const RightActions = styled.div`
    margin-left: auto;
    display: flex;
`

const useSelectFirstItemOnFirstLoad = (setOpenListIds: React.Dispatch<React.SetStateAction<string[]>>) => {
    const { lists, isSuccess } = useOverviewLists()
    const isFirstSuccess = useRef(true)
    const navigate = useNavigate()

    useEffect(() => {
        if (lists?.length === 0) return
        if (isSuccess && isFirstSuccess.current) {
            isFirstSuccess.current = false
            const firstNonEmptyView = lists?.find((list) => list.view_items.length > 0)
            if (firstNonEmptyView) {
                setOpenListIds((ids) => {
                    console.log(ids)
                    if (!ids.includes(firstNonEmptyView.id)) {
                        console.log('not includes')
                        return [...ids, firstNonEmptyView.id]
                    }
                    return ids
                })
                navigate(`/overview/${firstNonEmptyView.id}/${firstNonEmptyView.view_items[0].id}`, { replace: true })
            } else {
                navigate(`/overview`, { replace: true })
            }
        }
    }, [lists, isSuccess])
}

const DailyOverviewView = () => {
    const [isEditListsModalOpen, setIsEditListsModalOpen] = useState(false)
    const [editListTabIndex, setEditListTabIndex] = useState(0) // 0 - add, 1 - reorder

    const { calendarType } = useCalendarContext()

    const [openListIds, setOpenListIds] = useState<string[]>([])
    const expandAll = () => setOpenListIds(lists.map((list) => list.id))
    const collapseAll = () => setOpenListIds([])
    useSelectFirstItemOnFirstLoad(setOpenListIds)

    const { lists, isLoading } = useOverviewLists()

    if (isLoading) return <Spinner />
    return (
        <>
            <Flex>
                <ScrollableListTemplate>
                    <SectionHeader sectionName="Daily Overview" />
                    <ActionsContainer>
                        <BannerButton
                            styleType="simple"
                            size="small"
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
                        <RightActions>
                            <BannerButton
                                styleType="simple"
                                size="small"
                                onClick={collapseAll}
                                icon={icons.squareMinus}
                                iconColor="gray"
                                value="Collapse all"
                            />
                            <BannerButton
                                styleType="simple"
                                size="small"
                                onClick={expandAll}
                                icon={icons.squarePlus}
                                iconColor="gray"
                                value="Expand all"
                            />
                            <BannerButton
                                styleType="simple"
                                size="small"
                                onClick={() => {
                                    setEditListTabIndex(0)
                                    setIsEditListsModalOpen(true)
                                }}
                                icon={icons.gear}
                                iconColor="gray"
                                value="Edit lists"
                            />
                        </RightActions>
                    </ActionsContainer>
                    <SmartPrioritizationBanner />
                    {lists.map((list) => (
                        <AccordionItem
                            key={list.id}
                            list={list}
                            openListIds={openListIds}
                            setOpenListIds={setOpenListIds}
                        />
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
