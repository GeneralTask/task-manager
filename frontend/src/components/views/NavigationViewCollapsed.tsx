import styled from 'styled-components'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'
import CommandPalette from '../molecules/CommandPalette'
import FeedbackModal from '../molecules/FeedbackModal'
import SettingsModal from '../molecules/SettingsModal'
import IntegrationLinks from '../navigation_sidebar/IntegrationLinks'
import NavigationLink from '../navigation_sidebar/NavigationLink'

const CollapsedContainer = styled.div`
    padding: ${Spacing._24};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
    height: 100%;
    overflow-y: auto;
`
const FoldersContainer = styled.div`
    margin-top: ${Spacing._32};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
`
const LowerContainer = styled.div`
    margin-top: auto;
    padding-top: ${Spacing._32};
    margin-bottom: ${Spacing._64};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
`

interface NavigationViewCollapsedProps {
    setIsCollapsed: (isCollapsed: boolean) => void
}
const NavigationViewCollapsed = ({ setIsCollapsed }: NavigationViewCollapsedProps) => {
    const { data: folders } = useGetTasks()

    return (
        <CollapsedContainer>
            <GTIconButton icon={icons.expand} onClick={() => setIsCollapsed(false)} />
            <CommandPalette />
            <IntegrationLinks isCollapsed />
            <FoldersContainer>
                {folders?.map((folder) => {
                    let icon = icons.folder
                    if (folder.id === DEFAULT_SECTION_ID) icon = icons.inbox
                    else if (folder.is_done) icon = icons.checkbox_checked
                    else if (folder.is_trash) icon = icons.trash
                    return (
                        <NavigationLink
                            key={folder.id}
                            link={`/tasks/${folder.id}`}
                            title={folder.name}
                            icon={icon}
                            isCurrentPage={'' === folder.id}
                            taskSection={folder}
                            count={folder.tasks.length}
                            isCollapsed
                        />
                    )
                })}
            </FoldersContainer>
            <LowerContainer>
                <FeedbackModal isCollapsed />
                <SettingsModal isCollapsed />
            </LowerContainer>
        </CollapsedContainer>
    )
}

export default NavigationViewCollapsed
