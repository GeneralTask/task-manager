import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import CommandPalette from '../molecules/CommandPalette'
import FeedbackModal from '../molecules/FeedbackModal'
import SettingsModalButton from '../molecules/SettingsModalButton'
import IntegrationLinks from '../navigation_sidebar/IntegrationLinks'
import NavigationLink, { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
import Tip from '../radix/Tip'

const PositionedIcon = styled(Icon)`
    margin-bottom: ${Spacing._32};
`
const CollapseAndCommandPaletteContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: ${Spacing._32};
`
const CollapsedContainer = styled.div`
    padding: ${Spacing._24} 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    box-sizing: border-box;
`
const FoldersContainer = styled.div`
    margin-top: ${Spacing._32};
    display: flex;
    flex-direction: column;
`
const UpperContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const MiddleContainer = styled.div`
    overflow-y: auto;
`
const LowerContainer = styled.div`
    margin-top: auto;
    padding-top: ${Spacing._32};
    margin-bottom: auto;
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`

interface NavigationViewCollapsedProps {
    setIsCollapsed: (isCollapsed: boolean) => void
}
const NavigationViewCollapsed = ({ setIsCollapsed }: NavigationViewCollapsedProps) => {
    const { data: folders } = useGetTasks()
    const { section: sectionId } = useParams()

    return (
        <CollapsedContainer>
            <UpperContainer>
                <PositionedIcon icon={logos.generaltask_yellow_circle} size="medium" />
                <CollapseAndCommandPaletteContainer>
                    <Tip shortcutName="navigationView" side="right">
                        <CollapsedIconContainer onClick={() => setIsCollapsed(false)}>
                            <Icon icon={icons.sidebar} />
                        </CollapsedIconContainer>
                    </Tip>
                    <CommandPalette
                        customButton={(onClick: React.MouseEventHandler) => (
                            <Tip shortcutName="toggleCommandPalette" side="right">
                                <CollapsedIconContainer onClick={onClick}>
                                    <Icon icon={icons.magnifying_glass} />
                                </CollapsedIconContainer>
                            </Tip>
                        )}
                    />
                </CollapseAndCommandPaletteContainer>
            </UpperContainer>
            <MiddleContainer>
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
                                isCurrentPage={sectionId === folder.id}
                                taskSection={folder}
                                count={folder.tasks.length}
                                isCollapsed
                                droppable
                            />
                        )
                    })}
                </FoldersContainer>
            </MiddleContainer>
            <LowerContainer>
                <FeedbackModal isCollapsed />
                <SettingsModalButton isCollapsed />
            </LowerContainer>
        </CollapsedContainer>
    )
}

export default NavigationViewCollapsed
