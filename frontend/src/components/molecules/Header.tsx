import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID, DONE_SECTION_ID } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RefreshButton from '../atoms/buttons/RefreshButton'
import { Icon } from '../atoms/Icon'

const SectionHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${Spacing._16};
    min-height: 50px;
    gap: ${Spacing._4};
`
const HeaderText = styled.span`
    margin-right: ${Spacing._8};
    padding-left: 6px; /* TODO: remove margins and padding from Header */
    border: ${Border.stroke.large} solid transparent;
    overflow-wrap: break-word;
    min-width: 0;
    ${Typography.title};
`
const HeaderTextEditable = styled.input`
    margin-right: ${Spacing._8};
    padding-left: ${Spacing._4};
    border: none;
    outline: none;
    &:focus {
        border: ${Border.stroke.large} solid ${Colors.background.dark};
    }
    background-color: transparent;
    width: 100%;
    ${Typography.title};
`

const undeletableSectionIds = [DEFAULT_SECTION_ID, DONE_SECTION_ID]
const uneditableSectionIds = [DONE_SECTION_ID]
const matchUndeletableSectionId = (id: string) => undeletableSectionIds.includes(id)
const matchUneditableSectionId = (id: string) => uneditableSectionIds.includes(id)
interface SectionHeaderProps {
    sectionName: string
    allowRefresh: boolean
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
    const refetchStaleQueries = useRefetchStaleQueries()

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

    useKeyboardShortcut('refresh', refetchStaleQueries, false)

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
                <RefreshButton onClick={refetchStaleQueries} isRefreshing={props.isRefreshing}>
                    <Icon size="small" icon={icons.spinner} />
                </RefreshButton>
            )}
            {props.taskSectionId && !matchUndeletableSectionId(props.taskSectionId) && (
                <>
                    <NoStyleButton onClick={() => handleDelete(props.taskSectionId)}>
                        <Icon size="small" icon={icons.trash} color={Colors.icon.red}></Icon>
                    </NoStyleButton>
                </>
            )}
            {props.taskSectionId && !matchUneditableSectionId(props.taskSectionId) && (
                <>
                    <NoStyleButton onClick={() => setIsEditingTitle(true)}>
                        <Icon size="small" icon={icons.pencil}></Icon>
                    </NoStyleButton>
                </>
            )}
        </SectionHeaderContainer>
    )
}
