import React from 'react'
import { useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Dimensions, Shadows, Spacing } from '../../styles'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'
import { getTaskIndexFromSections } from '../../utils/utils'

const LabelEditorContainer = styled.div`
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
    padding: ${Spacing.padding._12} ${Spacing.padding._16};
    border-bottom: 1px solid ${Colors.background.medium};
`
const Header = styled.div`
    color: ${Colors.text.light};
`
const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._12} ${Spacing.padding._16};
    border-bottom: 1px solid ${Colors.background.medium};
    &:hover {
        background-color: ${Colors.background.medium};
    }
    cursor: pointer;
`
const SectionTitleBox = styled.div<{ isSelected: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.padding._8};
    color: ${(props) => (props.isSelected ? Colors.gtColor.primary : Colors.text.light)};
    min-width: 0;
`
const SectionName = styled.span`
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
`

interface LabelEditorProps {
    task_id: string
    closeLabelEditor: () => void
}
export default function LabelEditor({ task_id, closeLabelEditor }: LabelEditorProps): JSX.Element {
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
            closeLabelEditor()
        }

        return (
            <ListItem key={section.id} onClick={handleOnClick}>
                <SectionTitleBox isSelected={isCurrentSection}>
                    <Icon
                        size={'small'}
                        icon={icons.folder}
                        color={isCurrentSection ? Colors.icon.purple : Colors.icon.gray}
                    />
                    <SectionName>{section.name}</SectionName>
                </SectionTitleBox>
                {isCurrentSection && <Icon size={'xSmall'} icon={icons.checkbox_checked} color={Colors.icon.purple} />}
            </ListItem>
        )
    })

    return (
        <LabelEditorContainer onClick={(e) => e.stopPropagation()}>
            <TopNav>
                <Header>Set Label</Header>
            </TopNav>
            <OptionsContainer>{options}</OptionsContainer>
        </LabelEditorContainer>
    )
}
