import React, { useEffect, useState } from 'react'
import { useIsFetching } from 'react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID, DONE_SECTION_ID } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { Border, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'
import RefreshButton from '../atoms/buttons/RefreshButton'
import GTInput from '../atoms/GTInput'
import { Icon } from '../atoms/Icon'

const SectionHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
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

const undeletableSectionIds = [DEFAULT_SECTION_ID, DONE_SECTION_ID]
const uneditableSectionIds = [DONE_SECTION_ID]
const isDeletable = (id: string) => !undeletableSectionIds.includes(id)
const isEditable = (id: string) => !uneditableSectionIds.includes(id)
interface SectionHeaderProps {
    sectionName: string
    allowRefresh: boolean
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const { mutate: deleteTaskSection } = useDeleteTaskSection()
    const { mutate: modifyTaskSection } = useModifyTaskSection()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [sectionName, setSectionName] = useState(props.sectionName)
    const navigate = useNavigate()
    const refetchStaleQueries = useRefetchStaleQueries()
    const isFetching = useIsFetching() !== 0

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

    useKeyboardShortcut('refresh', refetchStaleQueries, false)

    const headerText = isEditingTitle ? (
        <GTInput
            initialValue={sectionName}
            fontSize="large"
            onEdit={(val) => setSectionName(val.substring(0, 200))}
            onBlur={() => handleChangeSectionName(props.taskSectionId, sectionName)}
            autoFocus
        />
    ) : (
        <HeaderText>{sectionName}</HeaderText>
    )

    return (
        <SectionHeaderContainer onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            {headerText}
            {props.allowRefresh && (isHovering || isFetching) && !isEditingTitle && (
                <RefreshButton onClick={refetchStaleQueries} isRefreshing={isFetching}>
                    <Icon size="small" icon={icons.spinner} />
                </RefreshButton>
            )}
            <div style={{ flex: 1 }}></div>
            {props.taskSectionId && isDeletable(props.taskSectionId) && !isEditingTitle && (
                <GTIconButton onClick={() => handleDelete(props.taskSectionId)} icon={icons.trash} iconColor="red" />
            )}
            {props.taskSectionId && isEditable(props.taskSectionId) && !isEditingTitle && (
                <GTIconButton onClick={() => setIsEditingTitle(true)} icon={icons.pencil} />
            )}
            {isEditingTitle && <GTIconButton onClick={() => setIsEditingTitle(false)} icon={icons.check} />}
        </SectionHeaderContainer>
    )
}
