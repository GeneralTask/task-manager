import React, { useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { FETCH_MESSAGES_URL, MESSAGES_FETCH_INTERVAL, MESSAGES_URL, TASKS_FETCH_INTERVAL } from '../../constants'
import { AbortID, FetchStatusEnum, NavbarPage } from '../../helpers/enums'
import { makeAuthorizedRequest, useInterval } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setMessages, setMessagesFetchStatus } from '../../redux/messagesPageSlice'
import { setShowCalendarSidebar } from '../../redux/tasksPageSlice'
import EventAlert from '../alert/EventAlert'
import CalendarSidebar from '../calendar/CalendarSidebar'
import ExpandCollapse from '../common/ExpandCollapse'
import Navbar from '../navbar/Navbar'
import { useFetchLinkedAccounts } from '../settings/Accounts'
import { useFetchSettings } from '../settings/Preferences'
import RefreshButton from '../task/RefreshButton'
import { useGetTasks } from '../task/TasksPage'
import Message from './Message'

const MessagesPageContainer = styled.div`
    display: flex;
    height: 100%;
    background: transparent;
`

const MessagesContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-width: 600px;
    flex: 1;
    overflow-y: auto;
    position: relative;
`
const Header = styled.div`
    display: flex;
    margin-bottom: 24px;
    width: 60%;
    align-self: center;
    justify-content: flex-start;
    position: relative;
    min-width: 500px;
`
const HeaderText = styled.div`
    font-size: 32px;
`
const TopBanner = styled.div`
    display: flex;
    justify-content: end;
    margin-top: 24px;
    padding-right: 24px;
`

export const useGetMessages = (): (() => Promise<void>) => {
    const dispatch = useAppDispatch()
    const getMessages = useCallback(async () => {
        try {
            dispatch(setMessagesFetchStatus(FetchStatusEnum.LOADING))
            const response = await makeAuthorizedRequest({
                url: MESSAGES_URL,
                method: 'GET',
                abortID: AbortID.MESSAGES,
            })
            fetchMessagesExternal()
            if (!response.ok) {
                dispatch(setMessagesFetchStatus(FetchStatusEnum.ERROR))
            } else {
                const resj = await response.json()
                dispatch(setMessagesFetchStatus(FetchStatusEnum.SUCCESS))
                dispatch(setMessages(resj))
            }
        } catch (e) {
            console.log({ e })
        }
    }, [])

    return getMessages
}

export async function fetchMessagesExternal() {
    await makeAuthorizedRequest({
        url: FETCH_MESSAGES_URL,
        method: 'GET',
    })
}

const CollapseCalendarSidebar = React.memo(() => {
    const dispatch = useAppDispatch()
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)
    if (!calendarSidebarShown) {
        return <ExpandCollapse direction="left" onClick={() => dispatch(setShowCalendarSidebar(true))} />
    } else return <></>
})

function Messages(): JSX.Element {
    const messages_array = useAppSelector((state) => state.messages_page.messages.messages_array)
    const getMessages = useGetMessages()
    const getTasks = useGetTasks()
    const fetchSettings = useFetchSettings()
    const fetchLinkedAccounts = useFetchLinkedAccounts()
    useEffect(() => {
        // fetch settings and linked accounts once on tasks page load
        fetchSettings()
        fetchLinkedAccounts()
    }, [])

    useInterval(getMessages, MESSAGES_FETCH_INTERVAL)
    useInterval(getTasks, TASKS_FETCH_INTERVAL)

    return (
        <MessagesContentContainer>
            <TopBanner>
                <CollapseCalendarSidebar />
            </TopBanner>
            <Header>
                <HeaderText>Messages</HeaderText>
                <RefreshButton />
            </Header>
            {messages_array && messages_array.map((message, index) => <Message message={message} key={index} />)}
        </MessagesContentContainer>
    )
}

const MessagesPage: React.FC = () => {
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)
    return (
        <MessagesPageContainer>
            <Navbar currentPage={NavbarPage.MESSAGES_PAGE} />
            <EventAlert>
                <Messages />
            </EventAlert>
            {calendarSidebarShown && <CalendarSidebar />}
        </MessagesPageContainer>
    )
}

export default MessagesPage
