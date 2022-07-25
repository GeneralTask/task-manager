import { Colors, Dimensions } from '../../styles'
import { weight, xxSmall } from '../../styles/typography'

import GTInputSelect from './GTInputSelect'
import React from 'react'
import { TopNav } from './DatePicker-style'
import { icons } from '../../styles/images'
import { padding } from '../../styles/spacing'
import { radius } from '../../styles/border'
import styled from 'styled-components'
import { useModifyTask } from '../../services/api/tasks.hooks'

export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${Dimensions.TASK_ACTION_WIDTH};
    position: absolute;
    background-color: ${Colors.background.white};
    border-radius: ${radius.small};
    box-shadow: 0 0 5px ${Colors.background.light};
    z-index: 1;
    top: 100%;
    right: 0;
    padding: ${padding._8};
    cursor: default;
`

export const Header = styled.div`
    font-weight: ${weight._600};
    font-size: ${xxSmall.fontSize};
    line-height: ${xxSmall.lineHeight};
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${Colors.text.light};
`

interface TimeEstimateProps {
    task_id: string
    closeTimeEstimate: () => void
}
export default function TimeEstimate({ task_id, closeTimeEstimate }: TimeEstimateProps): JSX.Element {
    const { mutate: modifyTask } = useModifyTask()

    const options = [
        { value: 5, label: '5 mins' },
        { value: 10, label: '10 mins' },
        { value: 15, label: '15 mins' },
        { value: 20, label: '20 mins' },
        { value: 30, label: '30 mins' },
        { value: 45, label: '45 mins' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' },
        { value: 180, label: '3 hours' },
        { value: 240, label: '4 hours' },
        { value: 300, label: '5 hours' },
        { value: 360, label: '6 hours' },
    ]

    return (
        <TimeEstimateContainer onClick={(e) => e.stopPropagation()}>
            <TopNav>
                <Header>Set Duration</Header>
            </TopNav>
            <GTInputSelect
                onChange={(e) => {
                    e.stopPropagation()
                }}
                onSubmit={(durationMinutes) => {
                    modifyTask({ id: task_id, timeAllocated: durationMinutes * 60000000 })
                    closeTimeEstimate()
                }}
                placeholder={'00:00'}
                options={options}
                pattern={'^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$'}
                invalidInput={'^[^0-9:]$'}
                inputIcon={icons['timer']}
            />
        </TimeEstimateContainer>
    )
}
