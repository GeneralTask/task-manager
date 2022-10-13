import { useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Shadows, Spacing, Typography } from '../../styles'
import { DropType } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import CommandPalette from '../molecules/CommandPalette'
import FeedbackButton from '../molecules/FeedbackButton'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'

const GT_BETA_LOGO_WIDTH = '111px'

const NavigationViewContainer = styled.div<{ showDropShadow: boolean }>`
    display: flex;
    flex-direction: column;
    min-width: 0px;
    min-height: 0px;
    background-color: ${Colors.background.medium};
    box-sizing: border-box;
    z-index: 1;
    ${(props) => props.showDropShadow && `box-shadow: ${Shadows.button.hover}`}
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
    color: ${Colors.text.placeholder};
    user-select: none;
    ${Typography.eyebrow};
    padding: ${Spacing._16};
`
const GTBetaLogo = styled.img`
    pointer-events: none;
    width: ${GT_BETA_LOGO_WIDTH};
`

const NavigationView = () => {
    const navigate = useNavigate()
    const { setCalendarType } = useCalendarContext()
    const { data: userInfo } = useGetUserInfo()

    const [isOver, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => monitor.isOver(),
        }),
        []
    )
    const copyrightText = userInfo?.is_employee ? '© 2022 GENERAL KENOBI' : '© 2022 GENERAL TASK'

    return (
        <NavigationViewContainer showDropShadow={isOver} ref={drop}>
            <NavigationViewHeader>
                <GTBetaLogo src="/images/GT-beta-logo.png" />
                <CommandPalette />
            </NavigationViewHeader>
            <OverflowContainer>
                <NavigationSectionLinks />
            </OverflowContainer>
            <GapView>
                <FeedbackButton />
                <GTButton
                    value="Settings"
                    styleType="secondary"
                    size="small"
                    fitContent={false}
                    onClick={() => {
                        setCalendarType('day')
                        navigate('/settings')
                    }}
                />
            </GapView>
            <CopyrightText>{copyrightText}</CopyrightText>
        </NavigationViewContainer>
    )
}

export default NavigationView
