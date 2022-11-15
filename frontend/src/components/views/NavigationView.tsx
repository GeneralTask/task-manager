import { useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useKeyboardShortcut, usePreviewMode } from '../../hooks'
import useGTLocalStorage from '../../hooks/useGTLocalStorage'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Shadows, Spacing } from '../../styles'
import { NAVIGATION_BAR_WIDTH } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import { DropType } from '../../utils/types'
import GTIconButton from '../atoms/buttons/GTIconButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Eyebrow } from '../atoms/typography/Typography'
import CommandPalette from '../molecules/CommandPalette'
import FeedbackModal from '../molecules/FeedbackModal'
import SettingsModalButton from '../molecules/SettingsModalButton'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import NavigationViewCollapsed from './NavigationViewCollapsed'

const GT_BETA_LOGO_WIDTH = '95px'

const NavigationViewContainer = styled.div<{ showDropShadow: boolean; isCollapsed: boolean }>`
    display: flex;
    flex-direction: column;
    min-width: 0px;
    min-height: 0px;
    background-color: ${Colors.background.medium};
    box-sizing: border-box;
    z-index: 1;
    ${(props) => props.showDropShadow && `box-shadow: ${Shadows.button.hover};`}
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
    padding: 0 ${Spacing._16};
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
const GTBetaLogo = styled.img`
    pointer-events: none;
    width: ${GT_BETA_LOGO_WIDTH};
`

const NavigationView = () => {
    const navigate = useNavigate()
    const { data: userInfo } = useGetUserInfo()
    const { isPreviewMode, toggle: togglePreviewMode } = usePreviewMode()
    const [isCollapsed, setIsCollapsed] = useGTLocalStorage('navigationCollapsed', false)

    const [isOver, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => monitor.isOver(),
        }),
        []
    )

    useKeyboardShortcut(
        'enterFocusMode',
        useCallback(() => navigate('/focus-mode'), [])
    )
    useKeyboardShortcut(
        'goToOverviewPage',
        useCallback(() => navigate('/overview'), [])
    )
    useKeyboardShortcut(
        'goToGithubPRsPage',
        useCallback(() => navigate('/pull-requests'), [])
    )
    useKeyboardShortcut(
        'goToLinearPage',
        useCallback(() => navigate('/linear'), [])
    )
    useKeyboardShortcut(
        'goToSlackPage',
        useCallback(() => navigate('/slack'), [])
    )
    useKeyboardShortcut(
        'goToTaskInbox',
        useCallback(() => navigate('/tasks'), [])
    )

    return (
        <NavigationViewContainer showDropShadow={isOver} ref={drop} isCollapsed={isCollapsed}>
            {isCollapsed ? (
                <NavigationViewCollapsed setIsCollapsed={setIsCollapsed} />
            ) : (
                <>
                    <NavigationViewHeader>
                        <GTBetaLogo src="/images/GT-beta-logo.png" />
                        <div>
                            {isPreviewMode && (
                                <GTIconButton icon={icons.collapse} onClick={() => setIsCollapsed(!isCollapsed)} />
                            )}
                            <CommandPalette />
                        </div>
                    </NavigationViewHeader>
                    <OverflowContainer>
                        <NavigationSectionLinks />
                    </OverflowContainer>
                    <GapView>
                        <FeedbackModal />
                        <SettingsModalButton />
                    </GapView>
                    <CopyrightText>
                        {userInfo?.is_employee ? (
                            <NoStyleButton onClick={() => togglePreviewMode()}>
                                <Eyebrow color={isPreviewMode ? 'purple' : 'light'}>
                                    {isPreviewMode ? '© 2022 GENERAL KENOBI' : '© 2022 GENERAL TASK'}
                                </Eyebrow>
                            </NoStyleButton>
                        ) : (
                            <Eyebrow color="light">© 2022 GENERAL TASK</Eyebrow>
                        )}
                    </CopyrightText>
                </>
            )}
        </NavigationViewContainer>
    )
}

export default NavigationView
