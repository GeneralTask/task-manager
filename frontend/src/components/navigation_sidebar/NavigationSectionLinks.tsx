import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useClickOutside } from '../../hooks'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useAddTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { DropItem, DropType } from '../../utils/types'
import { doesAccountNeedRelinking, isGithubLinked, isLinearLinked, isSlackLinked } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import NoStyleInput from '../atoms/NoStyleInput'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import NavigationContextMenuWrapper from '../radix/NavigationContextMenuWrapper'
import NavigationLink, { NavigationLinkTemplate } from './NavigationLink'
import NavigationLinkDropdown from './NavigationLinkDropdown'

const AddSectionContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._8};
    gap: ${Spacing._12};
    width: 100%;
    box-sizing: border-box;
`
const InputContainer = styled.div`
    & input {
        color: ${Colors.text.black};
        border: none;
        font-family: inherit;
        box-sizing: border-box;
        width: 100%;
        ${Typography.bodySmall};
    }
`

const NavigationSectionLinks = () => {
    const [isAddSectionInputVisible, setIsAddSectionInputVisible] = useState(false)
    const [sectionName, setSectionName] = useState('')
    const { mutate: addTaskSection } = useAddTaskSection()
    const { mutate: modifyTaskSection } = useModifyTaskSection()

    const { data: folders } = useGetTasks()
    const { data: pullRequestRepositories } = useGetPullRequests()
    const { section: sectionId } = useParams()
    const { pathname } = useLocation()

    const onKeyChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSectionName(e.target.value)
    }
    const onKeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()
        if (e.key === 'Enter' && sectionName.trim() !== '') {
            setSectionName('')
            addTaskSection({ name: sectionName, id_ordering: folders?.length })
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

    const handleReorder = useCallback((item: DropItem, dropIndex: number) => {
        modifyTaskSection({
            sectionId: item.id,
            id_ordering: dropIndex,
        })
    }, [])

    const defaultFolder = folders?.find((section) => section.id === DEFAULT_SECTION_ID)
    const doneFolder = folders?.find((section) => section.is_done)
    const trashFolder = folders?.find((section) => section.is_trash)

    const linearTasksCount = useMemo(() => {
        const tasks =
            folders?.filter((section) => !section.is_done && !section.is_trash).flatMap((folder) => folder.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Linear').length
    }, [folders])

    const slackTasksCount = useMemo(() => {
        const tasks =
            folders?.filter((section) => !section.is_done && !section.is_trash).flatMap((folder) => folder.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Slack' && (!task.is_done || task.optimisticId)).length
    }, [folders])

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isGithubIntegrationLinked = isGithubLinked(linkedAccounts || [])
    const isLinearIntegrationLinked = isLinearLinked(linkedAccounts || [])
    const isSlackIntegrationLinked = isSlackLinked(linkedAccounts || [])

    const githubCount = isGithubIntegrationLinked
        ? pullRequestRepositories?.reduce<number>((total, repo) => total + repo.pull_requests.length, 0)
        : undefined
    const linearCount = isLinearIntegrationLinked ? linearTasksCount : undefined
    const slackCount = isSlackIntegrationLinked ? slackTasksCount : undefined

    // Logic for updating section name from navigation view
    const [sectionBeingEdited, setSectionBeingEdited] = useState<string | null>(null)
    const [updatedSectionName, setUpdatedSectionName] = useState<string>('')
    const ref = useRef<HTMLDivElement>(null)

    const setCurrentSectionName = (sectionName: string) => setUpdatedSectionName(sectionName)
    useClickOutside(ref, () => setSectionBeingEdited(null))

    const onKeyDownHandlerSectionName = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()
        if (sectionBeingEdited == null) return
        if (e.key === 'Enter' && updatedSectionName.trim() !== '') {
            setSectionBeingEdited(null)
            setUpdatedSectionName('')
            modifyTaskSection({
                sectionId: sectionBeingEdited,
                name: updatedSectionName,
            })
        } else if (e.key === 'Escape') {
            setUpdatedSectionName('')
            setSectionBeingEdited(null)
        }
    }

    if (!folders) {
        return <Loading />
    }

    return (
        <>
            <NavigationLink
                link="/overview"
                title="Overview"
                icon={icons.list}
                isCurrentPage={pathname.split('/')[1] === 'overview'}
            />
            <NavigationLink
                link="/focus-mode"
                title="Enter Focus Mode"
                icon={icons.headphones}
                isCurrentPage={pathname.split('/')[1] === 'focus-mode'}
            />
            <NavigationLink
                link="/pull-requests"
                title="GitHub PRs"
                icon={logos.github}
                count={githubCount}
                needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Github')}
                isCurrentPage={pathname.split('/')[1] === 'pull-requests'}
            />
            <NavigationLink
                link="/linear"
                title="Linear Issues"
                icon={logos.linear}
                count={linearCount}
                needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Linear')}
                isCurrentPage={pathname.split('/')[1] === 'linear'}
            />
            <NavigationLink
                link="/slack"
                title="Slack"
                icon={logos.slack}
                count={slackCount}
                needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Slack')}
                isCurrentPage={pathname.split('/')[1] === 'slack'}
            />
            <NavigationLinkDropdown title="Folders" openAddSectionInput={onOpenAddSectionInputHandler}>
                {defaultFolder && (
                    <NavigationLink
                        link={`/tasks/${defaultFolder.id}`}
                        title={defaultFolder.name}
                        icon={icons.inbox}
                        isCurrentPage={sectionId === defaultFolder.id}
                        taskSection={defaultFolder}
                        count={defaultFolder.tasks.length}
                        droppable
                    />
                )}
                {folders
                    ?.filter((section) => section.id !== DEFAULT_SECTION_ID && !section.is_done && !section.is_trash)
                    .map((section, index) =>
                        sectionBeingEdited !== section.id ? (
                            <ReorderDropContainer
                                key={section.id}
                                index={index} // +1 because we skip the default folder
                                acceptDropType={DropType.FOLDER}
                                onReorder={handleReorder}
                            >
                                <NavigationContextMenuWrapper
                                    sectionId={section.id}
                                    setSectionName={() => setCurrentSectionName(section.name)}
                                    setSectionBeingEdited={setSectionBeingEdited}
                                >
                                    <NavigationLink
                                        key={section.id}
                                        link={`/tasks/${section.id}`}
                                        title={section.name}
                                        icon={icons.folder}
                                        isCurrentPage={sectionId === section.id}
                                        taskSection={section}
                                        count={section.tasks.length}
                                        draggable
                                        droppable
                                    />
                                </NavigationContextMenuWrapper>
                            </ReorderDropContainer>
                        ) : (
                            <NavigationLinkTemplate ref={ref}>
                                <AddSectionContainer>
                                    <div>
                                        <Icon icon={icons.folder} color="black" />
                                    </div>
                                    <InputContainer>
                                        <NoStyleInput
                                            ref={(node) => {
                                                if (!node) return
                                                if (sectionBeingEdited === section.id) node.focus()
                                                else if (sectionBeingEdited === null) node.blur()
                                            }}
                                            value={updatedSectionName}
                                            onChange={(e) => {
                                                setUpdatedSectionName(e.target.value)
                                            }}
                                            onKeyDown={onKeyDownHandlerSectionName}
                                            placeholder="Enter a section name"
                                        />
                                    </InputContainer>
                                </AddSectionContainer>
                            </NavigationLinkTemplate>
                        )
                    )}
                {isAddSectionInputVisible && (
                    <NavigationLinkTemplate>
                        <AddSectionContainer>
                            <div>
                                <Icon icon={icons.folder} color="black" />
                            </div>
                            <InputContainer>
                                <NoStyleInput
                                    ref={inputRef}
                                    value={sectionName}
                                    onChange={onKeyChangeHandler}
                                    onKeyDown={onKeyDownHandler}
                                    placeholder="Add Folder"
                                />
                            </InputContainer>
                        </AddSectionContainer>
                    </NavigationLinkTemplate>
                )}
                <ReorderDropContainer
                    index={folders.length - 2} // -2 because we skip the done and trash folders
                    acceptDropType={DropType.FOLDER}
                    onReorder={handleReorder}
                    indicatorType="TOP_ONLY"
                >
                    <>
                        {doneFolder && (
                            <NavigationLink
                                link={`/tasks/${doneFolder.id}`}
                                title={doneFolder.name}
                                icon={icons.checkbox_checked}
                                isCurrentPage={sectionId === doneFolder.id}
                                count={doneFolder.tasks.length}
                                taskSection={doneFolder}
                                droppable
                            />
                        )}
                        {trashFolder && (
                            <NavigationLink
                                link={`/tasks/${trashFolder.id}`}
                                title={trashFolder.name}
                                icon={icons.trash}
                                isCurrentPage={sectionId === trashFolder.id}
                                taskSection={trashFolder}
                                droppable
                            />
                        )}
                    </>
                </ReorderDropContainer>
            </NavigationLinkDropdown>
        </>
    )
}

export default NavigationSectionLinks
