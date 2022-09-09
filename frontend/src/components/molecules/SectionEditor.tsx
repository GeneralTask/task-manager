import { useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Dimensions, Shadows, Spacing, Typography } from '../../styles'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'
import { getTaskIndexFromSections } from '../../utils/utils'

const SectionEditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${Dimensions.TASK_ACTION_WIDTH};
    position: absolute;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    box-shadow: ${Shadows.medium};
    padding: ${Spacing._8} ${Spacing._4};
    gap: ${Spacing._4};
    z-index: 1;
    top: 100%;
    right: 0;
    overflow: auto;
    max-height: 500px;
    cursor: default;
    ${Typography.bodySmall};
`
const ListItem = styled.div<{ isSelected: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._4} ${Spacing._12};
    gap: ${Spacing._8};
    border-radius: ${Border.radius.mini};
    color: ${(props) => (props.isSelected ? Colors.text.black : Colors.text.light)};
    background-color: ${(props) => (props.isSelected ? Colors.background.medium : 'inherit')};
    &:hover {
        background-color: ${Colors.background.dark};
    }
    cursor: pointer;
`
const SectionName = styled.span`
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
`

interface SectionEditorProps {
    task_id: string
    closeSectionEditor: () => void
}
export default function SectionEditor({ task_id, closeSectionEditor }: SectionEditorProps): JSX.Element {
    const { mutate: reorderTask } = useReorderTask()
    const { data } = useGetTasks()

    const options = data?.map((section) => {
        // Do not allow moving to the done section
        if (section.is_done) return
        const { sectionIndex } = getTaskIndexFromSections(data, task_id)
        if (sectionIndex === undefined) return
        const currentSectionId = data[sectionIndex].id
        const isCurrentSection = section.id === currentSectionId

        const handleOnClick = () => {
            reorderTask({
                taskId: task_id,
                dropSectionId: section.id,
                orderingId: 1,
                dragSectionId: currentSectionId,
            })
            closeSectionEditor()
        }

        return (
            <ListItem key={section.id} onClick={handleOnClick} isSelected={isCurrentSection}>
                <Icon
                    size="xSmall"
                    icon={icons.folder}
                    color={isCurrentSection ? Colors.icon.black : Colors.icon.gray}
                />
                <SectionName>{section.name}</SectionName>
            </ListItem>
        )
    })

    return <SectionEditorContainer onClick={(e) => e.stopPropagation()}>{options}</SectionEditorContainer>
}
