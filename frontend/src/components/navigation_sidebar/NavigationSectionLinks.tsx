import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useAddTaskSection } from '../../services/api-query-hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskSection } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import NoStyleInput from '../atoms/NoStyleInput'
import NavigationLink from './NavigationLink'
import NavigationLinkDropdown from './NavigationLinkDropdown'

const AddSectionContainer = styled.div`
    display: flex;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    border: 2px solid transparent;
    align-items: center;
`
const AddSectionInputContainer = styled.div`
    overflow: clip;
    margin-left: ${Spacing.margin._8}px;
    flex: 1;
    min-width: 0;
`

interface SectionLinksProps {
    taskSections: TTaskSection[]
    sectionId: string
    pathName: string
}

const NavigationSectionLinks = ({ taskSections, sectionId, pathName }: SectionLinksProps) => {
    const [isAddSectionInputVisible, setIsAddSectionInputVisible] = useState(false)
    const [sectionName, setSectionName] = useState('')
    const { mutate: addTaskSection } = useAddTaskSection()
    const onAddSectionSubmitHandler = () => {
        setSectionName('')
        addTaskSection({ name: sectionName })
        setIsAddSectionInputVisible(false)
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
            <NavigationLinkDropdown title="Tasks" openAddSectionInput={onOpenAddSectionInputHandler}>
                {taskSections.map((section) => (
                    <NavigationLink
                        key={section.id}
                        link={`/tasks/${section.id}`}
                        title={section.name}
                        icon={icons.label}
                        isCurrentPage={sectionId === section.id}
                        taskSection={section}
                        droppable={!section.is_done}
                    />
                ))}
                {isAddSectionInputVisible && (
                    <AddSectionContainer>
                        <span>
                            <Icon size="small" source={icons.label} />
                        </span>
                        <AddSectionInputContainer>
                            <NoStyleInput
                                ref={inputRef}
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                placeholder={'Add Section'}
                                onSubmit={onAddSectionSubmitHandler}
                            />
                        </AddSectionInputContainer>
                    </AddSectionContainer>
                )}
            </NavigationLinkDropdown>
            <NavigationLink
                link="/messages"
                title="Messages"
                icon={icons.inbox}
                isCurrentPage={pathName === 'messages'}
            />
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
