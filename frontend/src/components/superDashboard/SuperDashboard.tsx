import { useState } from 'react'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import Metric from './Metric'
import dummyAPIReponse from './dummyData'
import { TDashboardView } from './types'

const Container = styled.div`
    display: flex;
    gap: ${Spacing._24};
    flex-wrap: wrap;
    width: 100%;
`

const SuperDashboard = () => {
    const data = dummyAPIReponse
    const [selectedView] = useState<TDashboardView>(data[0]) // TODO: add ability to select view

    return (
        <Container>
            {selectedView.metrics.map((metric) => (
                <Metric key={metric.name} metric={metric} />
            ))}
        </Container>
    )
}

export default SuperDashboard
