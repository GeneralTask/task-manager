import { useLayoutEffect, useState } from 'react'
import { useIsFetching } from 'react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteFolder, useModifyFolder } from '../../services/api/folders.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RefreshSpinner from '../atoms/buttons/RefreshSpinner'
import { useCalendarContext } from '../calendar/CalendarContext'

const SectionHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${Spacing._16};
    gap: ${Spacing._4};
`
const MarginLeftAutoFlex = styled.div`
    margin-left: auto;
    display: flex;
`
const HeaderButton = styled(NoStyleButton)`
    display: flex;
    align-items: center;
    min-width: 0;
    border-radius: ${Border.radius.small};
    gap: ${Spacing._8};
`
const HeaderText = styled.div<{ fontColor: TTextColor }>`
    color: ${({ fontColor }) => Colors.text[fontColor]};
    word-break: break-word;
    text-align: left;
    border: ${Border.stroke.medium} solid transparent;
    box-sizing: border-box;
    ${Typography.title};
`

const MAX_SECTION_NAME_LENGTH = 200

const undeletableSectionIds = [DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID]
const uneditableSectionIds = [DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID]
const isDeletable = (id: string) => !undeletableSectionIds.includes(id)
const isEditable = (id: string) => !uneditableSectionIds.includes(id)
interface SectionHeaderProps {
    sectionName: string
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const { mutate: deleteFolder } = useDeleteFolder()
    const { mutate: modifyFolder } = useModifyFolder()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [sectionName, setSectionName] = useState(props.sectionName)
    const navigate = useNavigate()
    const refetchStaleQueries = useRefetchStaleQueries()
    const isFetching = useIsFetching() !== 0
    const { calendarType, setShowTaskToCalSidebar } = useCalendarContext()

    useLayoutEffect(() => {
        setSectionName(props.sectionName)
    }, [props.sectionName])

    const handleDelete = async (id: string | undefined) => {
        if (id && confirm('Are you sure you want to delete this folder?')) {
            deleteFolder({ id })
            navigate('/tasks')
        }
    }
    const handleChangeSectionName = (id: string | undefined, name: string) => {
        const trimmedName = name.trim()
        if (id && trimmedName.length > 0) {
            modifyFolder({ id, name: trimmedName })
            setSectionName(trimmedName)
        } else {
            setSectionName(props.sectionName)
        }
        setIsEditingTitle(false)
    }

    useKeyboardShortcut('refresh', refetchStaleQueries)

    const showRefreshButton = (isHovering || isFetching) && !isEditingTitle

    return (
        <SectionHeaderContainer>
            <HeaderButton
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={refetchStaleQueries}
            >
                {isEditingTitle ? (
                    <GTTextField
                        type="plaintext"
                        value={sectionName}
                        fontSize="large"
                        onChange={(val) => setSectionName(val.substring(0, MAX_SECTION_NAME_LENGTH))}
                        onBlur={() => handleChangeSectionName(props.taskSectionId, sectionName)}
                        enterBehavior="blur"
                        autoSelect
                    />
                ) : (
                    <>
                        <HeaderText fontColor={isHovering ? 'purple' : 'black'}>{sectionName}</HeaderText>
                        <RefreshSpinner isRefreshing={isFetching} style={{ opacity: showRefreshButton ? 1 : 0 }}>
                            <Icon icon={icons.spinner} color={isHovering ? 'purple' : 'black'} />
                        </RefreshSpinner>
                    </>
                )}
            </HeaderButton>
            <MarginLeftAutoFlex>
                {props.taskSectionId && isDeletable(props.taskSectionId) && !isEditingTitle && (
                    <GTIconButton
                        onClick={() => handleDelete(props.taskSectionId)}
                        tooltipText="Delete folder"
                        icon={icons.trash}
                        iconColor="red"
                    />
                )}
                {props.taskSectionId && isEditable(props.taskSectionId) && !isEditingTitle && (
                    <GTIconButton
                        tooltipText="Edit folder name"
                        onClick={() => setIsEditingTitle(true)}
                        icon={icons.pencil}
                    />
                )}
                {isEditingTitle && (
                    <GTIconButton
                        tooltipText="Save folder name"
                        onClick={() => setIsEditingTitle(false)}
                        icon={icons.check}
                    />
                )}
                {calendarType === 'week' && (
                    <GTButton
                        styleType="secondary"
                        size="small"
                        value="Close task list"
                        icon={icons.x}
                        onClick={() => setShowTaskToCalSidebar(false)}
                    />
                )}
            </MarginLeftAutoFlex>
        </SectionHeaderContainer>
    )
}
