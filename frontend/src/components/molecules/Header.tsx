import React, { useEffect, useRef, useState } from 'react'
import { Colors, Spacing, Typography } from '../../styles'
import { useDeleteTaskSection, useModifyTaskSection } from '../../services/api-query-hooks'
import { Icon } from '../atoms/Icon'
import { KEYBOARD_SHORTCUTS } from '../../constants'
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
    margin-bottom: ${Spacing.margin._16}px;
    min-height: 50px;
    gap: ${Spacing.padding._4}px;
`
const HeaderText = styled.span`
    margin-right: ${Spacing.margin._8}px;
    font-size: ${Typography.xLarge.fontSize};
    padding-left: 6px;
    border: 2px solid transparent;
    overflow-wrap: break-word;
    min-width: 0;
    box-sizing: border-box;
`
const HeaderTextEditable = styled.input`
    margin-right: ${Spacing.margin._8}px;
    font-size: ${Typography.xLarge.fontSize};
    padding-left: ${Spacing.padding._4}px;
    border: none;
    outline: none;
    &:focus {
        border: 2px solid ${Colors.gray._400};
    }
    background-color: transparent;
    width: 100%;
`

const immutableSectionIds = ['000000000000000000000000', '000000000000000000000001', '000000000000000000000004']
const matchImmutableSectionId = (id: string) => immutableSectionIds.includes(id)
interface SectionHeaderProps {
    sectionName: string
    allowRefresh: boolean
    refetch?: () => void
    isRefetching?: boolean
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const { mutate: deleteTaskSection } = useDeleteTaskSection()
    const { mutate: modifyTaskSection } = useModifyTaskSection()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
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

    useKeyboardShortcut(KEYBOARD_SHORTCUTS.REFRESH, props.refetch ?? emptyFunction, props.refetch == null)

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
        <SectionHeaderContainer>
            {headerText}
            {props.allowRefresh && (
                <RefreshButton onClick={props.refetch} isRefreshing={props.isRefetching}>
                    <Icon size={'small'} source={icons.spinner} />
                </RefreshButton>
            )}
            {props.taskSectionId && !matchImmutableSectionId(props.taskSectionId) && (
                <>
                    <NoStyleButton onClick={() => handleDelete(props.taskSectionId)}>
                        <Icon size={'small'} source={icons['trash']}></Icon>
                    </NoStyleButton>
                    <NoStyleButton onClick={() => setIsEditingTitle(true)}>
                        <Icon size={'small'} source={icons['pencil']}></Icon>
                    </NoStyleButton>
                </>
            )}
        </SectionHeaderContainer>
    )
}
