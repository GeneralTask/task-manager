import { Colors, Spacing, Typography } from '../../styles'
import NavigationLink, { NavigationLinkTemplate } from './NavigationLink'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TEmailThread, TRepository, TTaskSection } from '../../utils/types'

import { Icon } from '../atoms/Icon'
import NavigationLinkDropdown from './NavigationLinkDropdown'
import NoStyleInput from '../atoms/NoStyleInput'
import { SHOW_PULL_REQUESTS } from '../../constants/gatekeep'
import { icons } from '../../styles/images'
import styled from 'styled-components'
import { useAddTaskSection } from '../../services/api-query-hooks'
import { weight } from '../../styles/typography'

const AddSectionInputContainer = styled.div`
    display: flex;
    align-items: center;
    overflow: clip;
    margin-left: ${Spacing.margin._8}px;
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

interface SectionLinksProps {
    taskSections: TTaskSection[]
    threads: TEmailThread[]
    pullRequestRepositories: TRepository[]
    sectionId: string
    repositoryId: string
    pathName: string
}

const NavigationSectionLinks = ({
    taskSections,
    threads,
    pullRequestRepositories,
    sectionId,
    repositoryId,
    pathName,
}: SectionLinksProps) => {
    const [isAddSectionInputVisible, setIsAddSectionInputVisible] = useState(false)
    const [sectionName, setSectionName] = useState('')
    const { mutate: addTaskSection } = useAddTaskSection()

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
            <NavigationLinkDropdown title="Tasks" icon={icons.label} openAddSectionInput={onOpenAddSectionInputHandler}>
                {taskSections
                    .filter((section) => !section.is_done)
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
                    .filter((section) => section.is_done)
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
            <NavigationLink
                link="/messages"
                title="Messages"
                icon={icons.inbox}
                count={threads.filter((t) => t.emails.find((e) => e.is_unread)).length}
                isCurrentPage={pathName === 'messages'}
            />
            {SHOW_PULL_REQUESTS && (
                <NavigationLinkDropdown title="Repository" icon={icons.repository}>
                    {pullRequestRepositories.map((repo) => (
                        <NavigationLink
                            key={repo.id}
                            link={`/pull-requests/${repo.id}`}
                            title={repo.name}
                            icon={icons.repository}
                            count={repo.pull_requests.length}
                            isCurrentPage={repositoryId === repo.id}
                        />
                    ))}
                </NavigationLinkDropdown>
            )}
            <NavigationLink
                link="/settings"
                title="Settings"
                icon={icons.gear}
                isCurrentPage={pathName === 'settings'}
            />
        </>
    )
}

export default NavigationSectionLinks
