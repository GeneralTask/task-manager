import { useLayoutEffect, useState } from 'react'
import { useIsFetching } from 'react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID, DONE_SECTION_ID, TRASH_SECTION_ID } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteTaskSection, useModifyTaskSection } from '../../services/api/task-section.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import GTIconButton from '../atoms/buttons/GTIconButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RefreshSpinner from '../atoms/buttons/RefreshSpinner'

const SectionHeaderContainer = styled.div`
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
    word-break: break-word;
    text-align: left;
    padding: ${Spacing._8};
    border: ${Border.stroke.medium} solid transparent;
    ${Typography.title};
    box-sizing: border-box;
    margin-bottom: 3.5px;
`

const MAX_SECTION_NAME_LENGTH = 200

const undeletableSectionIds = [DEFAULT_SECTION_ID, DONE_SECTION_ID, TRASH_SECTION_ID]
const uneditableSectionIds = [DONE_SECTION_ID, TRASH_SECTION_ID]
const isDeletable = (id: string) => !undeletableSectionIds.includes(id)
const isEditable = (id: string) => !uneditableSectionIds.includes(id)
interface SectionHeaderProps {
    sectionName: string
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

    useLayoutEffect(() => {
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
                        value={sectionName}
                        fontSize="large"
                        onChange={(val) => setSectionName(val.substring(0, MAX_SECTION_NAME_LENGTH))}
                        onBlur={() => handleChangeSectionName(props.taskSectionId, sectionName)}
                        blurOnEnter
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
                        icon={icons.trash}
                        iconColor="red"
                    />
                )}
                {props.taskSectionId && isEditable(props.taskSectionId) && !isEditingTitle && (
                    <GTIconButton onClick={() => setIsEditingTitle(true)} icon={icons.pencil} />
                )}
                {isEditingTitle && <GTIconButton onClick={() => setIsEditingTitle(false)} icon={icons.check} />}
            </MarginLeftAutoFlex>
        </SectionHeaderContainer>
    )
}
