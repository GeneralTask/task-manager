import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetDailyTaskCompletionByMonth } from '../../services/api/daily_task_completion.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { LabelSmall } from '../atoms/typography/Typography'

const BorderContainer = styled.div`
    padding: ${Spacing._8} ${Spacing._4};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.medium};
`
interface DailyTaskCompletionBreakdownProps {
    date: DateTime
}
const DaiilyTaskCompletionBreakdown = ({ date }: DailyTaskCompletionBreakdownProps) => {
    const { data } = useGetDailyTaskCompletionByMonth(date.month, date.year)
    const dailyTaskCompletionData = data?.find((item) => item.date === date.toFormat('yyyy-MM-dd'))

    if (dailyTaskCompletionData === undefined) {
        return (
            <BorderContainer>
                <LabelSmall color="muted">No activity</LabelSmall>
            </BorderContainer>
        )
    }
    return (
        <table>
            <tr>
                <th>App</th>
                <th>Items complete</th>
            </tr>
            {dailyTaskCompletionData.sources.map((source) => (
                <tr key={source.source_id}>
                    <td>{source.source_id}</td>
                    <td>{source.count}</td>
                </tr>
            ))}
        </table>
    )
}

export default DaiilyTaskCompletionBreakdown
