import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import styled from 'styled-components'
import { useModifyRecurringTask } from '../../../services/api/recurring-tasks.hooks'
import { useGetTasks } from '../../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { TRecurringTaskTemplate } from '../../../utils/types'
import Flex from '../../atoms/Flex'
import GTButton from '../../atoms/buttons/GTButton'
import FolderDropdown from '../../radix/FolderDropdown'

const Banner = styled.div`
    border-radius: ${Border.radius.mini};
    background-color: ${Colors.background.light};
    padding: ${Spacing._12} ${Spacing._16};
    ${Typography.label};
    color: ${Colors.text.light};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._12};
`
const FolderButton = styled(GTButton)`
    ${Typography.label};
`

interface RecurringTaskTemplateDetailsBannerProps {
    recurringTask: TRecurringTaskTemplate
}
const RecurringTaskTemplateDetailsBanner = ({ recurringTask }: RecurringTaskTemplateDetailsBannerProps) => {
    const { data: folders } = useGetTasks()
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const folder = useMemo(() => {
        const folder = folders?.find((folder) => folder.id === recurringTask.id_task_section)
        if (!folder) {
            Sentry.captureMessage(
                'Recurring task has invalid id_task_section with id: ' + recurringTask.id_task_section
            )
        }
        return folder
    }, [folders, recurringTask])
    if (!folder) return null
    return (
        <Banner>
            <div>
                This is a template for a recurring task. Any change you make will be reflected whenever this task
                repeats. Existing tasks will not be modified.
            </div>
            <Flex alignItems="center">
                Appears in folder:
                <Link to={`/tasks/${folder.id}`}>
                    <FolderButton
                        icon={icons.folder}
                        iconColor="purple"
                        styleType="simple"
                        textColor="purple"
                        size="small"
                        value={folder.name}
                    />
                </Link>
                <FolderDropdown
                    value={folder.id}
                    triggerText="change"
                    onChange={(newFolderId) =>
                        modifyRecurringTask(
                            {
                                id: recurringTask.id,
                                id_task_section: newFolderId,
                            },
                            recurringTask.optimisticId
                        )
                    }
                />
            </Flex>
        </Banner>
    )
}

export default RecurringTaskTemplateDetailsBanner
