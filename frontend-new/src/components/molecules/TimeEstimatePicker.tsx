import React from 'react'
import { useModifyTaskMutation } from '../../services/generalTaskApi'
import { icons } from '../../styles/images'
import { TopNav } from './DatePicker-style'
import GTSelect from './GTSelect'
import { Header, TimeEstimateContainer } from './TimeEstimate-style'

interface TimeEstimateProps {
    task_id: string
    closeTimeEstimate: () => void
}
export default function TimeEstimate({ task_id, closeTimeEstimate }: TimeEstimateProps): JSX.Element {
    const [modifyTask] = useModifyTaskMutation()

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
        <TimeEstimateContainer
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            <TopNav>
                <Header>Set Duration</Header>
            </TopNav>
            <GTSelect
                onChange={(e) => {
                    e.stopPropagation()
                }}
                onSubmit={(durationMinutes) => {
                    modifyTask({ id: task_id, time_duration: durationMinutes * 60000000 })
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
