import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useAddTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { DropItem, DropType } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import NoStyleInput from '../atoms/NoStyleInput'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import NavigationLink, { NavigationLinkTemplate } from './NavigationLink'
import NavigationLinkDropdown from './NavigationLinkDropdown'

const SHOW_TRASH_SECTION = false

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

    const handleReorder = useCallback((item: DropItem, dropIndex: number) => {
        modifyTaskSection({
            sectionId: item.id,
            id_ordering: dropIndex,
        })
    }, [])

    const defaultFolder = folders?.find((section) => section.id === DEFAULT_SECTION_ID)
    const doneFolder = folders?.find((section) => section.is_done)
    // TODO(maz): uncomment after we actually support task deletion
    const trashFolder = folders?.find((section) => section.is_trash)

    const linearTasksCount = useMemo(() => {
        const tasks =
            folders?.filter((section) => !section.is_done && !section.is_trash).flatMap((folder) => folder.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Linear').length
    }, [folders])

    const slackTasksCount = useMemo(() => {
        const tasks =
            folders?.filter((section) => !section.is_done && !section.is_trash).flatMap((folder) => folder.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Slack' && (!task.is_done || task.isOptimistic)).length
    }, [folders])

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
                title="GitHub Pull Requests"
                icon={logos.github}
                count={pullRequestRepositories?.reduce<number>((total, repo) => total + repo.pull_requests.length, 0)}
                isCurrentPage={pathname.split('/')[1] === 'pull-requests'}
            />
            <NavigationLink
                link="/linear"
                title="Linear Issues"
                icon={logos.linear}
                count={linearTasksCount}
                isCurrentPage={pathname.split('/')[1] === 'linear'}
            />
            <NavigationLink
                link="/slack"
                title="Slack"
                icon={logos.slack}
                count={slackTasksCount}
                isCurrentPage={pathname.split('/')[1] === 'slack'}
            />
            <NavigationLinkDropdown title="Tasks" openAddSectionInput={onOpenAddSectionInputHandler}>
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
                    .map((section, index) => (
                        <ReorderDropContainer
                            key={section.id}
                            index={index} // +1 because we skip the default folder
                            acceptDropType={DropType.FOLDER}
                            onReorder={handleReorder}
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
                        </ReorderDropContainer>
                    ))}
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
                                    placeholder="Add Section"
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
                        {doneFolder && ( // TODO(maz): remove after we actually support task deletion
                            <NavigationLink
                                link={`/tasks/${doneFolder.id}`}
                                title={doneFolder.name}
                                icon={icons.checkbox_checked}
                                isCurrentPage={sectionId === doneFolder.id}
                                taskSection={doneFolder}
                                count={doneFolder.tasks.length}
                                droppable
                            />
                        )}
                        {SHOW_TRASH_SECTION && trashFolder && (
                            <NavigationLink
                                link={`/tasks/${trashFolder.id}`}
                                title={trashFolder.name}
                                icon={icons.trash}
                                isCurrentPage={sectionId === trashFolder.id}
                                taskSection={defaultFolder}
                                count={trashFolder.tasks.length}
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
