import React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { TASK_ACTION_BASE_WIDTH } from '../../constants'
import { useGetTasks, useReorderTask } from '../../services/api-query-hooks'
import { Colors } from '../../styles'
import { radius } from '../../styles/border'
import { padding } from '../../styles/spacing'
import { weight, xxSmall } from '../../styles/typography'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { TopNav } from './DatePicker-style'

export const LabelEditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${TASK_ACTION_BASE_WIDTH}px;
    position: absolute;
    background-color: ${Colors.white};
    border-radius: ${radius.small};
    box-shadow: 0 0 5px ${Colors.gray._100};
    z-index: 1;
    top: 100%;
    right: 0;
    padding: ${padding.small}px;
    cursor: default;
    gap: 5px;
`

export const Header = styled.div`
    font-family: Switzer-Variable;
    font-weight: ${weight._600.fontWeight};
    font-size: ${xxSmall.fontSize}px;
    line-height: ${xxSmall.lineHeight}px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${Colors.gray._400};
`

interface LabelEditorProps {
    task_id: string
    closeLabelEditor: () => void
}
export default function LabelEditor({ task_id, closeLabelEditor }: LabelEditorProps): JSX.Element {
    const { mutate: reorderTask } = useReorderTask()
    const { data } = useGetTasks()

    const current_section_id = useParams().section || ''

    const options = data?.map(section => {
        if (section.is_done) return
        return (
            <RoundedGeneralButton key={section.id} value={section.name} hasBorder={true} textStyle={'dark'} onPress={() => {
                reorderTask({ taskId: task_id, dropSectionId: section.id, orderingId: 1, dragSectionId: current_section_id })
                closeLabelEditor()
            }} />
        )
    })

    return (
        <LabelEditorContainer onClick={e => e.stopPropagation()}>
            <TopNav>
                <Header>Set Label</Header>
            </TopNav>
            {options}
        </LabelEditorContainer>
    )
}
