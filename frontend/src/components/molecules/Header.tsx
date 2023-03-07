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
import GTButton from '../atoms/buttons/GTButtonNew'
import GTIconButton from '../atoms/buttons/GTIconButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RefreshSpinner from '../atoms/buttons/RefreshSpinner'
import { useCalendarContext } from '../calendar/CalendarContext'

const HeaderContainer = styled.div`
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
    border-radius: ${Border.radius.medium};
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

const MAX_FOLDER_NAME_LENGTH = 200

const undeletableFolderIds = [DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID]
const uneditableFolderIds = [DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID]
const isDeletable = (id: string) => !undeletableFolderIds.includes(id)
const isEditable = (id: string) => !uneditableFolderIds.includes(id)
interface HeaderProps {
    folderName: string
    folderId?: string
}
export const Header = (props: HeaderProps) => {
    const { mutate: deleteFolder } = useDeleteFolder()
    const { mutate: modifyFolder } = useModifyFolder()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [folderName, setFolderName] = useState(props.folderName)
    const navigate = useNavigate()
    const refetchStaleQueries = useRefetchStaleQueries()
    const isFetching = useIsFetching() !== 0
    const { calendarType, setShowTaskToCalSidebar } = useCalendarContext()

    useLayoutEffect(() => {
        setFolderName(props.folderName)
    }, [props.folderName])

    const handleDelete = async (id: string | undefined) => {
        if (id && confirm('Are you sure you want to delete this folder?')) {
            deleteFolder({ id })
            navigate('/tasks')
        }
    }
    const handleChangeFolderName = (id: string | undefined, name: string) => {
        const trimmedName = name.trim()
        if (id && trimmedName.length > 0) {
            modifyFolder({ id, name: trimmedName })
            setFolderName(trimmedName)
        } else {
            setFolderName(props.folderName)
        }
        setIsEditingTitle(false)
    }

    useKeyboardShortcut('refresh', refetchStaleQueries)

    const showRefreshButton = (isHovering || isFetching) && !isEditingTitle

    return (
        <HeaderContainer>
            <HeaderButton
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={refetchStaleQueries}
            >
                {isEditingTitle ? (
                    <GTTextField
                        type="plaintext"
                        value={folderName}
                        fontSize="large"
                        onChange={(val) => setFolderName(val.substring(0, MAX_FOLDER_NAME_LENGTH))}
                        onBlur={() => handleChangeFolderName(props.folderId, folderName)}
                        enterBehavior="blur"
                        autoSelect
                    />
                ) : (
                    <>
                        <HeaderText fontColor={isHovering ? 'purple' : 'black'}>{folderName}</HeaderText>
                        <RefreshSpinner isRefreshing={isFetching} style={{ opacity: showRefreshButton ? 1 : 0 }}>
                            <Icon icon={icons.spinner} color={isHovering ? 'purple' : 'black'} />
                        </RefreshSpinner>
                    </>
                )}
            </HeaderButton>
            <MarginLeftAutoFlex>
                {props.folderId && isDeletable(props.folderId) && !isEditingTitle && (
                    <GTIconButton
                        onClick={() => handleDelete(props.folderId)}
                        tooltipText="Delete folder"
                        icon={icons.trash}
                        iconColor="red"
                    />
                )}
                {props.folderId && isEditable(props.folderId) && !isEditingTitle && (
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
                        value="Close task list"
                        icon={icons.x}
                        onClick={() => setShowTaskToCalSidebar(false)}
                    />
                )}
            </MarginLeftAutoFlex>
        </HeaderContainer>
    )
}
