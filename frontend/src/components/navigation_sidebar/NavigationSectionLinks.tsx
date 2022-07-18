import { Colors, Spacing, Typography } from '../../styles'
import NavigationLink, { NavigationLinkTemplate } from './NavigationLink'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from '../atoms/Icon'
import NavigationLinkDropdown from './NavigationLinkDropdown'
import NoStyleInput from '../atoms/NoStyleInput'
import { icons } from '../../styles/images'
import { isDevelopmentMode } from '../../environment'
import styled from 'styled-components'
import { useAddTaskSection } from '../../services/api/task-section.hooks'
import { weight } from '../../styles/typography'

import { useParams, useLocation } from 'react-router-dom'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { useGetInfiniteThreads } from '../../services/api/threads.hooks'

const AddSectionInputContainer = styled.div`
    display: flex;
    align-items: center;
    overflow: clip;
    margin-left: ${Spacing.margin._8};
    flex: 1;
    min-width: 0;
    & input {
        font-weight: ${weight._500};
        font-size: ${Typography.xSmall.fontSize};
        color: ${Colors.gray._500};
        border: none;
        font-family: inherit;
    }
`
const IconContainer = styled.div`
    margin-left: 10px;
`

const NavigationSectionLinks = () => {
    const [isAddSectionInputVisible, setIsAddSectionInputVisible] = useState(false)
    const [sectionName, setSectionName] = useState('')
    const { mutate: addTaskSection } = useAddTaskSection()

    const { data: taskSections } = useGetTasks()
    const { data: threadDataInbox } = useGetInfiniteThreads({ isArchived: false })
    const { data: pullRequestRepositories } = useGetPullRequests()
    const { section: sectionId, mailbox: mailbox } = useParams()
    const { pathname } = useLocation()

    const threadsInbox = useMemo(() => threadDataInbox?.pages.flat().filter((t) => t != null) ?? [], [threadDataInbox])

    const onKeyChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSectionName(e.target.value)
    }
    const onKeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()
        if (e.key === 'Enter' && sectionName.trim() !== '') {
            setSectionName('')
            addTaskSection({ name: sectionName })
            setIsAddSectionInputVisible(false)
        } else if (e.key === 'Escape' && inputRef.current) {
            setSectionName('')
            setIsAddSectionInputVisible(false)
        }
    }
    const inputRef = useRef<HTMLInputElement>(null)
    const onOpenAddSectionInputHandler = useCallback(() => {
        setIsAddSectionInputVisible(true)
        inputRef.current?.focus()
    }, [inputRef])

    useEffect(() => {
        if (isAddSectionInputVisible && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isAddSectionInputVisible])

    const handleClickOutsideInput = (e: MouseEvent) => {
        if (!inputRef.current?.contains(e.target as Node)) {
            setIsAddSectionInputVisible(false)
        }
    }
    useEffect(() => {
        document.addEventListener('click', handleClickOutsideInput, false)
        return () => {
            document.removeEventListener('click', handleClickOutsideInput, false)
        }
    }, [])

    return (
        <>
            {isDevelopmentMode && (
                <NavigationLink
                    link="/overview"
                    title="Overview"
                    icon={icons.list}
                    isCurrentPage={pathname.split('/')[1] === 'overview'}
                />
            )}
            <NavigationLinkDropdown title="Tasks" icon="label" openAddSectionInput={onOpenAddSectionInputHandler}>
                {taskSections
                    ?.filter((section) => !section.is_done)
                    .map((section) => (
                        <NavigationLink
                            key={section.id}
                            link={`/tasks/${section.id}`}
                            title={section.name}
                            icon={icons.label}
                            isCurrentPage={sectionId === section.id}
                            taskSection={section}
                            count={section.tasks.length}
                            droppable
                            testId="task-section-link"
                        />
                    ))}
                {isAddSectionInputVisible && (
                    <NavigationLinkTemplate>
                        <IconContainer>
                            <Icon size="small" source={icons.label} />
                        </IconContainer>
                        <AddSectionInputContainer>
                            <NoStyleInput
                                ref={inputRef}
                                value={sectionName}
                                onChange={onKeyChangeHandler}
                                onKeyDown={onKeyDownHandler}
                                placeholder="Add Section"
                                data-testid="add-section-input"
                            />
                        </AddSectionInputContainer>
                    </NavigationLinkTemplate>
                )}
                {taskSections
                    ?.filter((section) => section.is_done)
                    .map((section) => (
                        <NavigationLink
                            key={section.id}
                            link={`/tasks/${section.id}`}
                            title={section.name}
                            icon={icons.label}
                            isCurrentPage={sectionId === section.id}
                            taskSection={section}
                            count={section.tasks.length}
                            droppable={false}
                            testId="done-section-link"
                        />
                    ))}
            </NavigationLinkDropdown>
            <NavigationLinkDropdown title="Messages" icon="label">
                <NavigationLink
                    link="/messages/inbox"
                    title="Inbox"
                    icon={icons.inbox}
                    count={threadsInbox?.filter((t) => t.emails.find((e) => e.is_unread)).length}
                    isCurrentPage={mailbox === 'inbox'}
                />
                <NavigationLink
                    link="/messages/archive"
                    title="Archive"
                    icon={icons.archive}
                    isCurrentPage={mailbox === 'archive'}
                />
            </NavigationLinkDropdown>
            <NavigationLink
                link="/pull-requests"
                title="Pull Requests"
                icon={icons.repository}
                count={pullRequestRepositories?.reduce<number>((total, repo) => total + repo.pull_requests.length, 0)}
                isCurrentPage={pathname.split('/')[1] === 'pull-requests'}
            />
            <NavigationLink
                link="/settings"
                title="Settings"
                icon={icons.gear}
                isCurrentPage={pathname.split('/')[1] === 'settings'}
            />
        </>
    )
}

export default NavigationSectionLinks
