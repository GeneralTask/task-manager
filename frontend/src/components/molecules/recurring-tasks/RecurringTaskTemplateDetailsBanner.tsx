import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import styled from 'styled-components'
import { useGetFolders } from '../../../services/api/folders.hooks'
import { useModifyRecurringTask } from '../../../services/api/recurring-tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import Flex from '../../atoms/Flex'
import { DeprecatedBold } from '../../atoms/typography/Typography'
import TemplateFolderSelector from './RecurringTaskTemplateModal/TemplateFolderSelector'

export const Banner = styled.div`
    border-radius: ${Border.radius.small};
    background-color: ${Colors.background.light};
    padding: ${Spacing._16};
    ${Typography.deprecated_bodySmall};
    color: ${Colors.text.light};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
const FolderSelectorContainer = styled.div`
    max-width: 200px;
    margin: 0 ${Spacing._4};
`

interface RecurringTaskTemplateDetailsBannerProps {
    id: string
    folderId: string
}
const RecurringTaskTemplateDetailsBanner = ({ id, folderId }: RecurringTaskTemplateDetailsBannerProps) => {
    const { data: folders } = useGetFolders()
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
                <DeprecatedBold>This is a template for a recurring task.</DeprecatedBold> Any changes you make will show
                up when it repeats again. Tasks you already have won’t be changed.
            </div>
            <Flex alignItems="center">
                Appears in folder:
                <FolderSelectorContainer>
                    <TemplateFolderSelector
                        value={folder.id}
                        onChange={(newFolderId) =>
                            modifyRecurringTask({
                                id,
                                id_task_section: newFolderId,
                            })
                        }
                    />
                </FolderSelectorContainer>
                <span>
                    (<Link to={`/tasks/${folder.id}`}>view folder</Link>)
                </span>
            </Flex>
        </Banner>
    )
}

export default RecurringTaskTemplateDetailsBanner
