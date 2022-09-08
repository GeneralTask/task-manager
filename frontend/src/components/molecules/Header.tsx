import React, { useEffect, useState } from 'react'
import { useIsFetching } from 'react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID, DONE_SECTION_ID } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RefreshButton from '../atoms/buttons/RefreshButton'
import GTInput from '../atoms/GTInput'
import { Icon } from '../atoms/Icon'

const SectionHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${Spacing._16};
    min-height: 50px;
    gap: ${Spacing._4};
`
const undeletableSectionIds = [DEFAULT_SECTION_ID, DONE_SECTION_ID]
const uneditableSectionIds = [DONE_SECTION_ID]
const matchUndeletableSectionId = (id: string) => undeletableSectionIds.includes(id)
const matchUneditableSectionId = (id: string) => uneditableSectionIds.includes(id)
interface SectionHeaderProps {
    sectionName: string
    allowRefresh: boolean
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const { mutate: deleteTaskSection } = useDeleteTaskSection()
    const { mutate: modifyTaskSection } = useModifyTaskSection()
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
    }

    useKeyboardShortcut('refresh', refetchStaleQueries, false)

    return (
        <SectionHeaderContainer onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <GTInput
                initialValue={sectionName}
                onEdit={(e) => setSectionName(e.substring(0, 200))}
                onBlur={() => handleChangeSectionName(props.taskSectionId, sectionName)}
                disabled={!props.taskSectionId || matchUneditableSectionId(props.taskSectionId)}
                fontSize={'large'}
            />
            {props.allowRefresh && (isHovering || isFetching) && (
                <RefreshButton onClick={refetchStaleQueries} isRefreshing={isFetching}>
                    <Icon size="small" icon={icons.spinner} />
                </RefreshButton>
            )}
            {props.taskSectionId && !matchUndeletableSectionId(props.taskSectionId) && (
                <NoStyleButton onClick={() => handleDelete(props.taskSectionId)}>
                    <Icon size="small" icon={icons.trash} color={Colors.icon.red}></Icon>
                </NoStyleButton>
            )}
        </SectionHeaderContainer>
    )
}
