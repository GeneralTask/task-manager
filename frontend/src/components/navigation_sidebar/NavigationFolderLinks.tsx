import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_FOLDER_ID } from '../../constants'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useAddTaskFolder, useModifyTaskFolder } from '../../services/api/task-folder.hooks'
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

const SHOW_TRASH_FOLDER = false

const AddFolderContainer = styled.div`
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

const NavigationFolderLinks = () => {
    const [isAddFolderInputVisible, setIsAddFolderInputVisible] = useState(false)
    const [folderName, setFolderName] = useState('')
    const { mutate: addTaskFolder } = useAddTaskFolder()
    const { mutate: modifyTaskFolder } = useModifyTaskFolder()

    const { data: folders } = useGetTasks()
    const { data: pullRequestRepositories } = useGetPullRequests()
    const { folder: folderId } = useParams()
    const { pathname } = useLocation()

    const onKeyChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFolderName(e.target.value)
    }
    const onKeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()
        if (e.key === 'Enter' && folderName.trim() !== '') {
            setFolderName('')
            addTaskFolder({ name: folderName })
            setIsAddFolderInputVisible(false)
        } else if (e.key === 'Escape' && inputRef.current) {
            setFolderName('')
            setIsAddFolderInputVisible(false)
        }
    }
    const inputRef = useRef<HTMLInputElement>(null)
    const onOpenAddFolderInputHandler = useCallback(() => {
        setIsAddFolderInputVisible(true)
        inputRef.current?.focus()
    }, [inputRef])

    useEffect(() => {
        if (isAddFolderInputVisible && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isAddFolderInputVisible])

    const handleClickOutsideInput = (e: MouseEvent) => {
        if (!inputRef.current?.contains(e.target as Node)) {
            setIsAddFolderInputVisible(false)
        }
    }
    useEffect(() => {
        document.addEventListener('click', handleClickOutsideInput, false)
        return () => {
            document.removeEventListener('click', handleClickOutsideInput, false)
        }
    }, [])

    const handleReorder = useCallback((item: DropItem, dropIndex: number) => {
        modifyTaskFolder({
            folderId: item.id,
            id_ordering: dropIndex,
        })
    }, [])

    const defaultFolder = folders?.find((folder) => folder.id === DEFAULT_FOLDER_ID)
    const doneFolder = folders?.find((folder) => folder.is_done)
    // TODO(maz): uncomment after we actually support task deletion
    const trashFolder = folders?.find((folder) => folder.is_trash)

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
                isCurrentPage={pathname.split('/')[1] === 'linear'}
            />
            <NavigationLinkDropdown title="Tasks" openAddFolderInput={onOpenAddFolderInputHandler}>
                {defaultFolder && (
                    <NavigationLink
                        link={`/tasks/${defaultFolder.id}`}
                        title={defaultFolder.name}
                        icon={icons.folder}
                        isCurrentPage={folderId === defaultFolder.id}
                        taskFolder={defaultFolder}
                        count={defaultFolder.tasks.length}
                        droppable
                        testId="task-folder-link"
                    />
                )}
                {folders
                    ?.filter((folder) => folder.id !== DEFAULT_FOLDER_ID && !folder.is_done && !folder.is_trash)
                    .map((folder, index) => (
                        <ReorderDropContainer
                            key={folder.id}
                            index={index} // +1 because we skip the default folder
                            acceptDropType={DropType.FOLDER}
                            onReorder={handleReorder}
                            dividerStyleType="purple"
                        >
                            <NavigationLink
                                key={folder.id}
                                link={`/tasks/${folder.id}`}
                                title={folder.name}
                                icon={icons.folder}
                                isCurrentPage={folderId === folder.id}
                                taskFolder={folder}
                                count={folder.tasks.length}
                                draggable
                                droppable
                                testId="task-folder-link"
                            />
                        </ReorderDropContainer>
                    ))}
                {isAddFolderInputVisible && (
                    <NavigationLinkTemplate>
                        <AddFolderContainer>
                            <div>
                                <Icon size="xSmall" icon={icons.folder} color={Colors.icon.black} />
                            </div>
                            <InputContainer>
                                <NoStyleInput
                                    ref={inputRef}
                                    value={folderName}
                                    onChange={onKeyChangeHandler}
                                    onKeyDown={onKeyDownHandler}
                                    placeholder="Add Folder"
                                    data-testid="add-folder-input"
                                />
                            </InputContainer>
                        </AddFolderContainer>
                    </NavigationLinkTemplate>
                )}
                <ReorderDropContainer
                    index={folders.length - 2} // -2 because we skip the done and trash folders
                    acceptDropType={DropType.FOLDER}
                    onReorder={handleReorder}
                    indicatorType="TOP_ONLY"
                    dividerStyleType="purple"
                >
                    <>
                        {doneFolder && ( // TODO(maz): remove after we actually support task deletion
                            <NavigationLink
                                link={`/tasks/${doneFolder.id}`}
                                title={doneFolder.name}
                                icon={icons.checkbox_checked}
                                isCurrentPage={folderId === doneFolder.id}
                                taskFolder={doneFolder}
                                count={doneFolder.tasks.length}
                                droppable
                                testId="task-folder-link"
                            />
                        )}
                        {SHOW_TRASH_FOLDER && trashFolder && (
                            <NavigationLink
                                link={`/tasks/${trashFolder.id}`}
                                title={trashFolder.name}
                                icon={icons.trash}
                                isCurrentPage={folderId === trashFolder.id}
                                taskFolder={defaultFolder}
                                count={trashFolder.tasks.length}
                                droppable
                                testId="task-folder-link"
                            />
                        )}
                    </>
                </ReorderDropContainer>
            </NavigationLinkDropdown>
        </>
    )
}

export default NavigationFolderLinks
