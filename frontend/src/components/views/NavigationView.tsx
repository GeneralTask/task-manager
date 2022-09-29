import { useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Colors, Shadows, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { DropType } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import CommandPalette from '../molecules/CommandPalette'
import FeedbackButton from '../molecules/FeedbackButton'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'

const NavigationViewContainer = styled.div<{ showDropShadow: boolean }>`
    display: flex;
    flex-direction: column;
    min-width: 0px;
    min-height: 0px;
    background-color: ${Colors.background.medium};
    padding: ${Spacing._16};
    box-sizing: border-box;
    z-index: 1;
    ${(props) => props.showDropShadow && `box-shadow: ${Shadows.button.secondary.hover}`}
`
const NavigationViewHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-basis: 24px;
    width: 100%;
    margin-bottom: ${Spacing._16};
`
const OverflowContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
    padding-bottom: ${Spacing._8};
    margin-top: auto;
`
const CopyrightText = styled.span`
    margin-top: ${Spacing._4};
    text-align: center;
    color: ${Colors.text.placeholder};
    ${Typography.eyebrow};
`

const NavigationView = () => {
    const navigate = useNavigate()
    const { setCalendarType } = useCalendarContext()

    const [isOver, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => monitor.isOver(),
        }),
        []
    )

    return (
        <NavigationViewContainer showDropShadow={isOver} ref={drop}>
            <NavigationViewHeader>
                <Icon size="gtLogo" icon={logos.generaltask} color="purple" />
                <CommandPalette />
            </NavigationViewHeader>
            <OverflowContainer>
                <NavigationSectionLinks />
            </OverflowContainer>
            <GapView>
                <FeedbackButton />
                <GTButton
                    value="Account settings"
                    styleType="secondary"
                    size="small"
                    fitContent={false}
                    onClick={() => {
                        setCalendarType('day')
                        navigate('/settings')
                    }}
                />
            </GapView>
            <CopyrightText>© GeneralTask 2022</CopyrightText>
        </NavigationViewContainer>
    )
}

export default NavigationView
