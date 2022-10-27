import { useLocation, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { TTask } from '../../../utils/types'
import useOverviewLists from '../../overview/useOverviewLists'

export const SubtaskContainer = styled.div`
    border: ${Border.stroke.small} solid ${Colors.border.light};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._16};
    typography: ${Typography.body};
    cursor: pointer;
    :hover {
        background-color: ${Colors.background.medium};
    }
`

interface SubtaskProps {
    sectionId: string
    parentTaskId: string
    subtask: TTask
}
const Subtask = ({ sectionId, parentTaskId, subtask }: SubtaskProps) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { lists: views } = useOverviewLists()

    const { overviewViewId, overviewItemId, overviewItemSubId } = useParams()

    const onClickHandler = () => {
        if (location.pathname.includes('tasks')) {
            navigate(`/tasks/${sectionId}/${parentTaskId}/${subtask.id}`)
        } else if (location.pathname.includes('overview')) {
            for (const view of views) {
                if (view.id !== overviewViewId) continue
                for (const item of view.view_items) {
                    if (item.id !== overviewItemId) continue
                    if (view.type === 'github') {
                        continue
                    }
                    console.log(overviewItemSubId)
                    const detailsLink = subtask
                        ? `/overview/${view.id}/${item.id}/${subtask.id}`
                        : `/overview/${view.id}/${item.id}/`
                    navigate(detailsLink)
                }
            }
        }
    }

    return <SubtaskContainer onClick={onClickHandler}>{subtask.title}</SubtaskContainer>
}

export default Subtask
