import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import Flex from '../atoms/Flex'
import DateSelector from './DateSelector'
import Metric from './Metric'
import dummyAPIReponse from './dummyData'
import { TDashboardView } from './types'

const Metrics = styled.div`
    display: flex;
    gap: ${Spacing._24};
    flex-wrap: wrap;
    width: 100%;
`

const SuperDashboard = () => {
    const [startDate, setStartDate] = useState<DateTime>(() => {
        const now = DateTime.now()
        // if it's the weekend, show the current week
        if (now.weekday === 6 || now.weekday === 7) {
            return now.startOf('week')
        } // otherwise show the previous week
        return DateTime.now().startOf('week').minus({ week: 1 })
    })

    const data = dummyAPIReponse
    const [selectedView] = useState<TDashboardView>(data[0]) // TODO: add ability to select view

    return (
        <Flex column gap={Spacing._24}>
            <DateSelector startDate={startDate} setStartDate={setStartDate} />
            <Metrics>
                {selectedView.metrics.map((metric) => (
                    <Metric key={metric.name} metric={metric} startDate={startDate} />
                ))}
            </Metrics>
        </Flex>
    )
}

export default SuperDashboard
