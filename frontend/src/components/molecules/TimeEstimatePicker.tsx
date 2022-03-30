import React from 'react'
import styled from 'styled-components'
import { useModifyTask } from '../../services/api-query-hooks'
import { Colors } from '../../styles'
import { icons } from '../../styles/images'
import { weight, xxSmall } from '../../styles/typography'
import { TopNav } from './DatePicker-style'
import GTSelect from './GTSelect'

const TIME_ESTIMATOR_WIDTH = 150
const TIME_ESTIMATOR_PADDING = 10
export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${TIME_ESTIMATOR_WIDTH}px;
    position: absolute;
    background-color: ${Colors.white};
    border-radius: 10px;
    box-shadow: 0 0 5px ${Colors.gray._100};
    z-index: 1;
    top: 100%;
    right: 0;
    padding: ${TIME_ESTIMATOR_PADDING}px;
    cursor: default;
`

export const Header = styled.div`
    font-family: Switzer-Variable;
    font-weight: ${weight._600.fontWeight};
    font-size: ${xxSmall.fontSize}px;
    line-height: ${xxSmall.lineHeight}px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${Colors.gray._400};
    padding: 5px;
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
        <TimeEstimateContainer onClick={e => e.stopPropagation()}>
            <TopNav>
                <Header>Set Duration</Header>
            </TopNav>
            <GTSelect
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
