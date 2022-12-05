import { useState } from 'react'
import ReactTooltip from 'react-tooltip'
import { ToastViewport as ToastPrimitiveViewport } from '@radix-ui/react-toast'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { MEDIA_MAX_WIDTH, TOOLTIP_MAX_WIDTH, WINDOW_MIN_WIDTH } from '../../styles/dimensions'
import { logos } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import Toast from '../radix/Toast'
import CalendarView from '../views/CalendarView'
import NavigationView from '../views/NavigationView'

const TOAST_WIDTH = '390px'

const DefaultTemplateContainer = styled.div`
    display: grid;
    grid-template-columns: min-content minmax(300px, auto) max-content;
    grid-auto-flow: column;
    grid-template-rows: 100%;
    height: 100vh;
    background-color: ${Colors.background.light};
    position: relative;
    min-width: ${WINDOW_MIN_WIDTH};
    a {
        color: ${Colors.gtColor.primary};
    }
    .tooltip {
        box-shadow: ${Shadows.light} !important;
        border-radius: ${Border.radius.medium} !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu,
            Cantarell, Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol' !important;
        ${Typography.bodySmall};
        padding: ${Spacing._8} !important;
        max-width: ${TOOLTIP_MAX_WIDTH};
    }
`

const TasksandDetails = styled.div`
    flex: 1;
    flex-direction: row;
    display: flex;
    position: relative;
    overflow: hidden;
    background-color: inherit;
    @media only screen and (max-device-width: ${MEDIA_MAX_WIDTH}) {
        overflow: auto;
    }
`
const ToastViewport = styled(ToastPrimitiveViewport)`
    position: fixed;
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    padding: ${Spacing._24};
    gap: ${Spacing._8};
    width: ${TOAST_WIDTH};
    max-width: 100vw;
    margin: 0;
    list-style: none;
    z-index: 2147483647;
    outline: none;
`
interface DefaultTemplateProps {
    children: React.ReactNode
}

const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    const { calendarType } = useCalendarContext()

    const [toast, setToast] = useState(false)
    const [toast2, setToast2] = useState(false)

    return (
        <>
            <DefaultTemplateContainer>
                <ReactTooltip
                    id="navigation-tooltip"
                    effect="solid"
                    delayShow={250}
                    delayUpdate={500}
                    className="tooltip"
                    backgroundColor={Colors.background.white}
                    textColor={Colors.text.black}
                    place="right"
                />
                <ReactTooltip
                    id="recipients-tooltip"
                    effect="solid"
                    delayShow={250}
                    delayHide={250}
                    delayUpdate={500}
                    className="recipients-tooltip"
                    backgroundColor={Colors.background.white}
                    textColor={Colors.text.black}
                />
                <ReactTooltip
                    id="tooltip"
                    effect="solid"
                    delayShow={250}
                    delayUpdate={500}
                    className="tooltip"
                    backgroundColor={Colors.background.white}
                    textColor={Colors.text.black}
                />
                <NavigationView />
                {calendarType === 'day' && <TasksandDetails>{children}</TasksandDetails>}
                <CalendarView initialType="day" />
            </DefaultTemplateContainer>
            <Toast
                open={toast}
                onOpenChange={setToast}
                duration={10000}
                title="Doctor's appointment in 5 minutes"
                body="This doctor's appointment was created automatically for you by General Task"
                action={<GTButton styleType="simple" value="Join" icon={logos.google_meet} asDiv />}
            />
            <Toast
                open={toast2}
                onOpenChange={setToast2}
                duration={10000}
                title="Doctor's appointment in 2 minutes"
                body="This doctor's appointment was created automatically for you by General Task"
                action={<GTButton styleType="simple" value="Join" icon={logos.google_meet} asDiv />}
            />
            <GTButton
                styleType="simple"
                value="Join"
                icon={logos.google_meet}
                onClick={() => {
                    setToast(true)
                    setToast2(true)
                }}
                asDiv
            />
            <ToastViewport />
        </>
    )
}

export default DefaultTemplate
