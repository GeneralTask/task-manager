import styled from 'styled-components'
import { useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Dimensions, Shadows, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { getTaskIndexFromFolders } from '../../utils/utils'
import { Icon } from '../atoms/Icon'

const FolderEditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${Dimensions.TASK_ACTION_WIDTH};
    position: absolute;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.medium};
    z-index: 1;
    top: 100%;
    right: 0;
    cursor: default;
`
const OptionsContainer = styled.div`
    overflow: auto;
    max-height: 500px;
`
const TopNav = styled.div`
    padding: ${Spacing._12} ${Spacing._16};
    border-bottom: 1px solid ${Colors.background.medium};
`
const Header = styled.div`
    color: ${Colors.text.light};
`
const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._12} ${Spacing._16};
    border-bottom: 1px solid ${Colors.background.medium};
    &:hover {
        background-color: ${Colors.background.medium};
    }
    cursor: pointer;
`
const FolderTitleBox = styled.div<{ isSelected: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
    color: ${(props) => (props.isSelected ? Colors.gtColor.primary : Colors.text.light)};
    min-width: 0;
`
const FolderName = styled.span`
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
`

interface FolderEditorProps {
    task_id: string
    closeFolderEditor: () => void
}
export default function FolderEditor({ task_id, closeFolderEditor }: FolderEditorProps): JSX.Element {
    const { mutate: reorderTask } = useReorderTask()
    const { data } = useGetTasks()

    const options = data?.map((folder) => {
        // Do not allow moving to the done or trash folders
        if (folder.is_done || folder.is_trash) return
        const { folderIndex } = getTaskIndexFromFolders(data, task_id)
        if (folderIndex === undefined) return
        const currentFolderId = data[folderIndex].id
        const isCurrentFolder = folder.id === currentFolderId

        const handleOnClick = () => {
            reorderTask({
                taskId: task_id,
                dropFolderId: folder.id,
                orderingId: 1,
                dragFolderId: currentFolderId,
            })
            closeFolderEditor()
        }

        return (
            <ListItem key={folder.id} onClick={handleOnClick}>
                <FolderTitleBox isSelected={isCurrentFolder}>
                    <Icon
                        size={'small'}
                        icon={icons.folder}
                        color={isCurrentFolder ? Colors.icon.purple : Colors.icon.gray}
                    />
                    <FolderName>{folder.name}</FolderName>
                </FolderTitleBox>
                {isCurrentFolder && <Icon size={'xSmall'} icon={icons.checkbox_checked} color={Colors.icon.purple} />}
            </ListItem>
        )
    })

    return (
        <FolderEditorContainer onClick={(e) => e.stopPropagation()}>
            <TopNav>
                <Header>Set Folder</Header>
            </TopNav>
            <OptionsContainer>{options}</OptionsContainer>
        </FolderEditorContainer>
    )
}
