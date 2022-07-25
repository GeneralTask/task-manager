import React from 'react'
import { useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { Colors, Dimensions, Shadows, Spacing } from '../../styles'
import { radius } from '../../styles/border'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'

const PRIORITY_SECTION_ID = '000000000000000000000000'

const LabelEditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${Dimensions.TASK_ACTION_WIDTH};
    position: absolute;
    background-color: ${Colors.background.white};
    border-radius: ${radius.regular};
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
    color: ${(props) => (props.isSelected ? Colors.gtColor.secondary : Colors.text.light)};
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

    const navigate = useNavigate()
    const params = useParams()
    const current_section_id = params.section || ''

    const options = data?.map((section) => {
        // Do not allow moving to the done or the priority sections
        if (section.is_done || section.id === PRIORITY_SECTION_ID) return
        const isCurrentSection = section.id === current_section_id

        const handleOnClick = () => {
            reorderTask({
                taskId: task_id,
                dropSectionId: section.id,
                orderingId: 1,
                dragSectionId: current_section_id,
            })
            closeLabelEditor()
            navigate(`/tasks/${current_section_id}`)
        }

        return (
            <ListItem key={section.id} onClick={handleOnClick}>
                <SectionTitleBox isSelected={isCurrentSection}>
                    <Icon size={'small'} source={isCurrentSection ? icons.inbox_purple : icons.inbox} />
                    <SectionName>{section.name}</SectionName>
                </SectionTitleBox>
                {isCurrentSection && <Icon size={'xSmall'} source={icons.task_complete} />}
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
