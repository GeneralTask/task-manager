import { useLayoutEffect, useState } from 'react'
import { useIsFetching } from 'react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteTaskFolder, useModifyTaskFolder } from '../../services/api/task-folder.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import GTTextArea from '../atoms/GTTextArea'
import { Icon } from '../atoms/Icon'
import GTIconButton from '../atoms/buttons/GTIconButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RefreshSpinner from '../atoms/buttons/RefreshSpinner'

const FolderHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${Spacing._16};
    min-height: 50px;
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
`
const HeaderText = styled.div<{ fontColor: TTextColor }>`
    color: ${({ fontColor }) => Colors.text[fontColor]};
    word-break: break-all;
    text-align: left;
    padding: ${Spacing._8};
    ${Typography.title};
`

const MAX_NAME_LENGTH = 200

const undeletableFolderIds = [DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID]
const uneditableFolderIds = [DONE_FOLDER_ID, TRASH_FOLDER_ID]
const isDeletable = (id: string) => !undeletableFolderIds.includes(id)
const isEditable = (id: string) => !uneditableFolderIds.includes(id)
interface HeaderProps {
    name: string
    taskFolderId?: string
}
export const Header = (props: HeaderProps) => {
    const { mutate: deleteTaskFolder } = useDeleteTaskFolder()
    const { mutate: modifyTaskFolder } = useModifyTaskFolder()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [name, setFolderName] = useState(props.name)
    const navigate = useNavigate()
    const refetchStaleQueries = useRefetchStaleQueries()
    const isFetching = useIsFetching() !== 0

    useLayoutEffect(() => {
        setFolderName(props.name)
    }, [props.name])

    const handleDelete = async (id: string | undefined) => {
        if (id && confirm('Are you sure you want to delete this folder?')) {
            deleteTaskFolder({ folderId: id })
            navigate('/tasks')
        }
    }
    const handleChangeFolderName = (id: string | undefined, name: string) => {
        const trimmedName = name.trim()
        if (id && trimmedName.length > 0) {
            modifyTaskFolder({ folderId: id, name: trimmedName })
            setFolderName(trimmedName)
        } else {
            setFolderName(props.name)
        }
        setIsEditingTitle(false)
    }

    useKeyboardShortcut('refresh', refetchStaleQueries)

    const showRefreshButton = (isHovering || isFetching) && !isEditingTitle

    return (
        <FolderHeaderContainer>
            <HeaderButton
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={refetchStaleQueries}
            >
                {isEditingTitle ? (
                    <GTTextArea
                        initialValue={name}
                        fontSize="large"
                        onEdit={(val) => setFolderName(val.substring(0, MAX_NAME_LENGTH))}
                        onBlur={() => handleChangeFolderName(props.taskFolderId, name)}
                        blurOnEnter
                        disabled={!isEditingTitle}
                        onFocus={(e) => e.target.select()}
                        autoFocus
                    />
                ) : (
                    <>
                        <HeaderText fontColor={isHovering ? 'purple' : 'black'}>{name}</HeaderText>
                        <RefreshSpinner isRefreshing={isFetching} style={{ opacity: showRefreshButton ? 1 : 0 }}>
                            <Icon
                                size="small"
                                icon={icons.spinner}
                                color={isHovering ? Colors.gtColor.primary : Colors.text.black}
                            />
                        </RefreshSpinner>
                    </>
                )}
            </HeaderButton>
            <MarginLeftAutoFlex>
                {props.taskFolderId && isDeletable(props.taskFolderId) && !isEditingTitle && (
                    <GTIconButton
                        onClick={() => handleDelete(props.taskFolderId)}
                        icon={icons.trash}
                        iconColor="red"
                        size="small"
                    />
                )}
                {props.taskFolderId && isEditable(props.taskFolderId) && !isEditingTitle && (
                    <GTIconButton onClick={() => setIsEditingTitle(true)} icon={icons.pencil} size="small" />
                )}
                {isEditingTitle && (
                    <GTIconButton onClick={() => setIsEditingTitle(false)} icon={icons.check} size="small" />
                )}
            </MarginLeftAutoFlex>
        </FolderHeaderContainer>
    )
}
