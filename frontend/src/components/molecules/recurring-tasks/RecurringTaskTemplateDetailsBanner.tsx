import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import styled from 'styled-components'
import { useModifyRecurringTask } from '../../../services/api/recurring-tasks.hooks'
import { useGetTasks } from '../../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import GTButton from '../../atoms/buttons/GTButton'
import { Bold } from '../../atoms/typography/Typography'
import FolderSelector from '../FolderSelector'

export const Banner = styled.div`
    border-radius: ${Border.radius.mini};
    background-color: ${Colors.background.light};
    padding: ${Spacing._16};
    ${Typography.bodySmall};
    color: ${Colors.text.light};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._12};
`
const FolderButton = styled(GTButton)`
    ${Typography.label};
`

interface RecurringTaskTemplateDetailsBannerProps {
    id: string
    folderId: string
}
const RecurringTaskTemplateDetailsBanner = ({ id, folderId }: RecurringTaskTemplateDetailsBannerProps) => {
    const { data: folders } = useGetTasks()
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const folder = useMemo(() => {
        const folder = folders?.find((folder) => folder.id === folderId)
        if (!folder) {
            Sentry.captureMessage('Recurring task template has invalid id_task_section with id: ' + folderId)
        }
        return folder
    }, [folders, folderId])
    if (!folder) return null
    return (
        <Banner>
            <div>
                <Bold>This is a template for a recurring task.</Bold> Any changes you make will show up when it repeats
                again. Tasks you already have won’t be changed.
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
                <FolderSelector
                    value={folder.id}
                    onChange={(newFolderId) =>
                        modifyRecurringTask({
                            id,
                            id_task_section: newFolderId,
                        })
                    }
                    renderTrigger={(isOpen, setIsOpen) => (
                        <FolderButton
                            onClick={() => setIsOpen(!isOpen)}
                            value="change"
                            styleType="simple"
                            size="small"
                            isDropdown
                            asDiv
                        />
                    )}
                />
            </Flex>
        </Banner>
    )
}

export default RecurringTaskTemplateDetailsBanner
