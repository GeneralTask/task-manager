import React, { useEffect, useRef, useState } from 'react'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { useDeleteTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { Icon } from '../atoms/Icon'
import { emptyFunction } from '../../utils/utils'
import { icons } from '../../styles/images'
import styled from 'styled-components'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { useNavigate } from 'react-router-dom'
import RefreshButton from '../atoms/buttons/RefreshButton'

const SectionHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${Spacing.margin._16};
    min-height: 50px;
    gap: ${Spacing.padding._4};
`
const HeaderText = styled.span`
    margin-right: ${Spacing.margin._8};
    padding-left: 6px; /* TODO: remove margins and padding from Header */
    border: ${Border.stroke.large} solid transparent;
    overflow-wrap: break-word;
    min-width: 0;
    ${Typography.title};
`
const HeaderTextEditable = styled.input`
    margin-right: ${Spacing.margin._8};
    padding-left: ${Spacing.padding._4};
    border: none;
    outline: none;
    &:focus {
        border: ${Border.stroke.large} solid ${Colors.background.dark};
    }
    background-color: transparent;
    width: 100%;
    ${Typography.title};
`

const immutableSectionIds = ['000000000000000000000001', '000000000000000000000004']
const matchImmutableSectionId = (id: string) => immutableSectionIds.includes(id)
interface SectionHeaderProps {
    sectionName: string
    allowRefresh: boolean
    refetch?: () => void
    isRefreshing?: boolean
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const { mutate: deleteTaskSection } = useDeleteTaskSection()
    const { mutate: modifyTaskSection } = useModifyTaskSection()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [sectionName, setSectionName] = useState(props.sectionName)
    const sectionTitleRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    useEffect(() => {
        setSectionName(props.sectionName)
    }, [props.sectionName])

    const handleDelete = async (id: string | undefined) => {
        if (id && confirm('Are you sure you want to delete this section?')) {
            deleteTaskSection({ sectionId: id })
            navigate('/tasks')
        }
    }
    const handleChangeSectionName = (id: string | undefined, name: string) => {
        const trimmedName = name.trim()
        if (id && trimmedName.length > 0) {
            modifyTaskSection({ sectionId: id, name: trimmedName })
            setSectionName(trimmedName)
        } else {
            setSectionName(props.sectionName)
        }
        setIsEditingTitle(false)
    }
    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (sectionTitleRef.current && (e.key === 'Enter' || e.key === 'Escape')) sectionTitleRef.current.blur()
        e.stopPropagation()
    }

    useKeyboardShortcut('refresh', props.refetch ?? emptyFunction, props.refetch == null)

    const headerText = isEditingTitle ? (
        <HeaderTextEditable
            ref={sectionTitleRef}
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value.substring(0, 200))}
            onKeyDown={handleKeyDown}
            onBlur={() => handleChangeSectionName(props.taskSectionId, sectionName)}
            autoFocus
        />
    ) : (
        <HeaderText>{sectionName}</HeaderText>
    )

    return (
        <SectionHeaderContainer onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            {headerText}
            {props.allowRefresh && (isHovering || props.isRefreshing) && (
                <RefreshButton onClick={props.refetch} isRefreshing={props.isRefreshing}>
                    <Icon size={'small'} icon={icons.spinner} />
                </RefreshButton>
            )}
            {props.taskSectionId && !matchImmutableSectionId(props.taskSectionId) && (
                <>
                    <NoStyleButton onClick={() => handleDelete(props.taskSectionId)}>
                        <Icon size={'small'} icon={icons.trash} color={Colors.icon.red}></Icon>
                    </NoStyleButton>
                    <NoStyleButton onClick={() => setIsEditingTitle(true)}>
                        <Icon size={'small'} icon={icons.pencil}></Icon>
                    </NoStyleButton>
                </>
            )}
        </SectionHeaderContainer>
    )
}
