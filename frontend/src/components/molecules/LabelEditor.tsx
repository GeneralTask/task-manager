import React from 'react'
import { useGetTasks, useReorderTask } from '../../services/api-query-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { Colors, Shadows, Spacing } from '../../styles'
import { TASK_ACTION_BASE_WIDTH } from '../../constants'
import { radius } from '../../styles/border'
import { setSelectedItemId } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'

const LabelEditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${TASK_ACTION_BASE_WIDTH}px;
    position: absolute;
    background-color: ${Colors.white};
    border-radius: ${radius.regular};
    box-shadow: ${Shadows.medium};
    z-index: 1;
    top: 100%;
    right: 0;
    cursor: default;
`
const Options = styled.div`
    overflow: auto;
    max-height: 500px;
`
const TopNav = styled.div`
    display: flex;
    justify-content: space-around;
    padding: ${Spacing.padding._12}px 0;
`
const Header = styled.div`
    color: ${Colors.gray._600};
`
const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._12}px;
    border-bottom: 1px solid ${Colors.gray._200};
    &:hover {
        background-color: ${Colors.gray._100};
    }
    cursor: pointer;
`
const SectionTitleBox = styled.span<{ isSelected: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.padding._8}px;
    color: ${(props) => (props.isSelected ? Colors.purple._1 : Colors.gray._600)};
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
    const dispatch = useAppDispatch()
    const params = useParams()
    const current_section_id = params.section || ''

    const options = data?.map((section) => {
        if (section.is_done) return
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
            dispatch(setSelectedItemId(null))
        }

        return (
            <ListItem key={section.id} onClick={handleOnClick}>
                <SectionTitleBox isSelected={isCurrentSection}>
                    <Icon size={'small'} source={icons.inbox} />
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
            <Options>{options}</Options>
        </LabelEditorContainer>
    )
}
