import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useClickOutside } from '../../hooks'
import { useAddTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { DropItem, DropType, TTaskSection } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import NoStyleInput from '../atoms/NoStyleInput'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import NavigationContextMenuWrapper from '../radix/NavigationContextMenuWrapper'
import IntegrationLinks from './IntegrationLinks'
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
    const { section: sectionId } = useParams()

    const onKeyChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSectionName(e.target.value)
    }
    const onKeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()
        if (e.key === 'Enter' && sectionName.trim() !== '') {
            setSectionName('')
            addTaskSection({ optimisticId: uuidv4(), name: sectionName, id_ordering: folders?.length })
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
        modifyTaskSection(
            {
                id: item.id,
                id_ordering: dropIndex,
            },
            item.task?.optimisticId
        )
    }, [])

    const defaultFolder = folders?.find((section) => section.id === DEFAULT_SECTION_ID)
    const doneFolder = folders?.find((section) => section.is_done)
    const trashFolder = folders?.find((section) => section.is_trash)

    // Logic for updating section name from navigation view
    const [sectionBeingEdited, setSectionBeingEdited] = useState<TTaskSection | null>(null)
    const [updatedSectionName, setUpdatedSectionName] = useState<string>('')
    const ref = useRef<HTMLDivElement>(null)

    useClickOutside(ref, () => setSectionBeingEdited(null))

    const onKeyDownHandlerSectionName = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()
        if (sectionBeingEdited == null) return
        if (e.key === 'Enter' && updatedSectionName.trim() !== '') {
            setSectionBeingEdited(null)
            setUpdatedSectionName('')
            modifyTaskSection(
                {
                    id: sectionBeingEdited.id,
                    name: updatedSectionName,
                },
                sectionBeingEdited.optimisticId
            )
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
            <IntegrationLinks />
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
                        sectionBeingEdited?.id !== section.id ? (
                            <ReorderDropContainer
                                key={section.id}
                                index={index} // +1 because we skip the default folder
                                acceptDropType={DropType.FOLDER}
                                onReorder={handleReorder}
                            >
                                <NavigationContextMenuWrapper
                                    section={section}
                                    setSectionBeingEdited={(section) => {
                                        setUpdatedSectionName(section.name)
                                        setSectionBeingEdited(section)
                                    }}
                                >
                                    <NavigationLink
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
                            <NavigationLinkTemplate key={section.id} ref={ref}>
                                <AddSectionContainer>
                                    <div>
                                        <Icon icon={icons.folder} color="black" />
                                    </div>
                                    <InputContainer>
                                        <NoStyleInput
                                            ref={(node) => {
                                                if (!node) return
                                                if (sectionBeingEdited.id === section.id) node.focus()
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
