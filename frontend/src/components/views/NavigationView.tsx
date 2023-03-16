import { useCallback } from 'react'
import { useDrop } from 'react-dnd'
import styled from 'styled-components'
import { useGlobalKeyboardShortcuts, useKeyboardShortcut, usePreviewMode } from '../../hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Shadows, Spacing } from '../../styles'
import { NAVIGATION_BAR_WIDTH } from '../../styles/dimensions'
import { icons, logos } from '../../styles/images'
import { DropType } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTButton from '../atoms/buttons/GTButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { DeprecatedEyebrow } from '../atoms/typography/Typography'
import CommandPalette from '../molecules/CommandPalette'
import FeedbackModal from '../molecules/FeedbackModal'
import SettingsModalButton from '../molecules/SettingsModalButton'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import NoteCreateButton from '../notes/NoteCreateButton'
import NavigationViewCollapsed from './NavigationViewCollapsed'

const GT_BETA_LOGO_WIDTH = '95px'

const NavigationViewContainer = styled.div<{ showDropShadow: boolean; isCollapsed: boolean }>`
    display: flex;
    flex-direction: column;
    min-width: 0px;
    min-height: 0px;
    background-color: ${Colors.background.sub};
    box-sizing: border-box;
    z-index: 1;
    ${(props) => props.showDropShadow && `box-shadow: ${Shadows.deprecated_button.hover};`}
    width: ${({ isCollapsed }) => (isCollapsed ? 'fit-content' : NAVIGATION_BAR_WIDTH)};
`
const NavigationViewHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-basis: 24px;
    width: 100%;
    margin-top: ${Spacing._8};
    margin-bottom: ${Spacing._24};
    padding: ${Spacing._16} ${Spacing._16} 0;
    box-sizing: border-box;
`
const OverflowContainer = styled.div`
    flex: 1;
    margin-bottom: ${Spacing._8};
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding: 0 ${Spacing._8};
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
    padding-bottom: ${Spacing._8};
    margin-top: auto;
    padding: 0 ${Spacing._16};
`
const CopyrightText = styled.span`
    margin-top: ${Spacing._4};
    text-align: center;
    user-select: none;
    padding: ${Spacing._16};
`
export const GTBetaLogo = styled.img`
    pointer-events: none;
    width: ${GT_BETA_LOGO_WIDTH};
`
interface NavigationViewProps {
    isCollapsed: boolean
    setIsCollapsed: (isCollapsed: boolean) => void
}
const NavigationView = ({ isCollapsed, setIsCollapsed }: NavigationViewProps) => {
    useGlobalKeyboardShortcuts()
    const { data: userInfo } = useGetUserInfo()
    const { isPreviewMode, toggle: togglePreviewMode } = usePreviewMode()

    const [isOver, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => monitor.isOver(),
        }),
        []
    )
    useKeyboardShortcut(
        'navigationView',
        useCallback(() => {
            setIsCollapsed(!isCollapsed)
        }, [isCollapsed])
    )

    return (
        <NavigationViewContainer showDropShadow={isOver} ref={drop} isCollapsed={isCollapsed}>
            {isCollapsed ? (
                <NavigationViewCollapsed setIsCollapsed={setIsCollapsed} />
            ) : (
                <>
                    <NavigationViewHeader>
                        <GTBetaLogo src={isPreviewMode ? logos.generaltask_beta_blue : logos.generaltask_beta_yellow} />
                        <Flex gap={Spacing._4}>
                            <GTButton
                                styleType="icon"
                                icon={icons.sidebar}
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                shortcutName="navigationView"
                            />
                            <NoteCreateButton type="icon" />
                            <CommandPalette />
                        </Flex>
                    </NavigationViewHeader>
                    <OverflowContainer>
                        <NavigationSectionLinks />
                    </OverflowContainer>
                    <GapView>
                        <FeedbackModal />
                        <SettingsModalButton type="nav-button" />
                    </GapView>
                    <CopyrightText>
                        {userInfo?.is_employee ? (
                            <NoStyleButton onClick={() => togglePreviewMode()}>
                                <DeprecatedEyebrow color={isPreviewMode ? 'purple' : 'light'}>
                                    {isPreviewMode ? '© 2023 GENERAL KENOBI' : '© 2023 GENERAL TASK'}
                                </DeprecatedEyebrow>
                            </NoStyleButton>
                        ) : (
                            <DeprecatedEyebrow color="light">© 2023 GENERAL TASK</DeprecatedEyebrow>
                        )}
                    </CopyrightText>
                </>
            )}
        </NavigationViewContainer>
    )
}

export default NavigationView
