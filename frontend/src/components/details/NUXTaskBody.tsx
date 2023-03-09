import { useState } from 'react'
import styled from 'styled-components'
import { GITHUB_SUPPORTED_TYPE_NAME, GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import Spinner from '../atoms/Spinner'
import SettingsModal from '../molecules/SettingsModal'

const Container = styled.div<{ isFullHeight?: boolean; minHeight?: number }>`
    background-color: inherit;
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.medium};
    width: 100%;
    padding: ${Spacing._8};
    ${Typography.deprecated_bodySmall};
    :hover {
        box-shadow: ${Shadows.deprecated_light};
        background-color: ${Colors.background.white};
        border-color: ${Colors.background.border};
    }
`
const DivCursorPointer = styled.div`
    cursor: pointer;
`

const TaskToCal = () => {
    return (
        <Container>
            <strong>Welcome to General Task!</strong> To help you get started, we’ve put together a list of introductory
            tasks.
            <p>
                <strong>Task-to-Calendar</strong> can help you set aside time for each of your tasks. If you’d like to
                set aside time to work on something, just <strong>drag a task over to the calendar sidebar</strong> on
                the right. This will also add it to your Google Calendar.
            </p>
            <p>
                ✅ Click the checkbox to mark this task as complete whenever you feel ready. Next up, we’ll take a look
                at Focus Mode.
            </p>
            <img width="100%" src="/images/nux-task-to-cal.png" />
        </Container>
    )
}

const FocusMode = () => {
    return (
        <Container>
            <strong>Focus Mode</strong> helps you stay on track by focusing on one task at a time.
            <p>
                You can <strong>enter Focus Mode from the navigation bar on the left</strong> or by pressing the{' '}
                <strong>F key</strong>. From here, Focus Mode will spotlight whichever tasks or events you have planned
                at that time. You can even join meetings with just one click. If you don’t have anything on your
                calendar, Focus Mode will present you a few options to help you decide what to work on next.
            </p>
            <p>
                <strong>Pro tip:</strong> You can pin the tab in your browser, or keep it on a second monitor for easy
                access to your task and event details throughout the day. Give it a try and see how it works for you.
            </p>
            <img src="/images/nux-focus-mode.png" width="100%" />
        </Container>
    )
}

const IntegrationsStaticContent = ({
    googleUrl,
    githubUrl,
    linearUrl,
    slackUrl,
    setIsSettingsModalOpen,
}: {
    googleUrl: string
    githubUrl: string
    linearUrl: string
    slackUrl: string
    setIsSettingsModalOpen: (isSettingsModalOpen: boolean) => void
}) => (
    <>
        With General Task, you can <strong>connect a variety of services</strong> to give you a comprehensive view of
        all your tasks and reduce the need to switch between apps.
        <p>
            📅 <a href={googleUrl}>Google Calendar</a>: easily schedule tasks onto your calendar.
            <br />
            🤖 <a href={githubUrl}>GitHub</a>: manage and view your pull requests.
            <br />✅ <a href={linearUrl}>Linear</a>: edit and keep track of your assigned issues.
            <br />
            💬 <a href={slackUrl}>Slack</a>: easily convert actionable messages into tasks.
            <br />
        </p>
        <p>
            You can find the full list of services in settings. Please leave us feedback to let us know which services
            you want to see next.
        </p>
        <DivCursorPointer onClick={() => setIsSettingsModalOpen(true)}>
            <img src="/images/nux-integrations.png" width="100%" />
        </DivCursorPointer>
    </>
)

const Integrations = () => {
    const { data: supportedTypes } = useGetSupportedTypes()
    const googleUrl =
        supportedTypes?.find((type) => type.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)?.authorization_url || ''
    const githubUrl = supportedTypes?.find((type) => type.name === GITHUB_SUPPORTED_TYPE_NAME)?.authorization_url || ''
    const linearUrl = supportedTypes?.find((type) => type.name === 'Linear')?.authorization_url || ''
    const slackUrl = supportedTypes?.find((type) => type.name === 'Slack')?.authorization_url || ''
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

    return (
        <Container>
            <IntegrationsStaticContent
                googleUrl={googleUrl}
                githubUrl={githubUrl}
                linearUrl={linearUrl}
                slackUrl={slackUrl}
                setIsSettingsModalOpen={setIsSettingsModalOpen}
            />
            <SettingsModal isOpen={isSettingsModalOpen} setIsOpen={setIsSettingsModalOpen} />
        </Container>
    )
}

const JohnsLetterStaticContent = () => (
    <>
        <p>
            Thank you for choosing General Task! We know that there are many productivity solutions on the market, and
            we are truly honored that you landed on us.
        </p>
        <p>
            We have spent the last year building what we believe to be the best productivity solution on the market for
            software engineers. And it’s free! We don’t limit our software to those who can afford to pay $30+/month,
            like many of our competitors do. At General Task, we believe that everyone, not just a select few, should
            have access to the very best productivity tools and services. That means we will be keeping our personal
            productivity solution <strong>free forever</strong>.
        </p>
        <p>
            Productivity is close to our hearts. Our team has worked at some of the most successful companies in the
            industry: Meta, Netflix, LinkedIn, Robinhood, as well as many other smaller companies. We learned a lot and
            had a good time, but we also saw the downside of working at such companies: pointless meetings, constant
            distractions and waiting way too long to get your code reviewed, among many other issues.
        </p>
        <p>
            We know how crappy it can feel to have an unproductive day and how awesome it can feel to be super
            productive day. We want to make those awesome days happen all the time. That’s why we built this. We use
            General Task in-house daily, and we are already seeing substantial improvements in our own productivity. It
            feels great. We hope you enjoy the tool as much as we do!
        </p>
        <p>
            General Task, as it is currently available, is in beta. This means that it is an imperfect work in progress,
            but will improve rapidly to help you be more and more productive over time. We are just getting started, and
            we can’t wait to have you along for the ride.
        </p>
        <p>
            <strong>But we can’t do this alone!</strong>
        </p>
        <p>
            We are committed to listening to each and every one of your ideas, and will work tirelessly to improve our
            software as much as possible, as fast as possible. Please send us any bugs you notice, or product ideas
            you’d like to see in the app. Anything helps!
        </p>
        <p>
            Reach out to us with any questions, comments, or concerns at{' '}
            <a href="mailto:julian@generaltask.com">julian@generaltask.com</a> or{' '}
            <a href="mailto:john@generaltask.com">john@generaltask.com</a>.
        </p>
        <p>Happy building!</p>
        <p>Julian and John</p>
    </>
)

const JohnsLetter = () => {
    const { data: userInfo } = useGetUserInfo()
    if (!userInfo) return <Spinner />
    const firstName = userInfo.name.split(' ')[0]
    return (
        <Container>
            Hi {firstName},
            <JohnsLetterStaticContent />
        </Container>
    )
}

const SlackTask = () => {
    return (
        <Container>
            With the Slack integration, you can <strong>quickly create a new task from a message</strong> by using the
            three-dot menu. This can be a great way to keep track of important to-dos and ensure that nothing falls
            through the cracks.
            <ul>
                <li>
                    First, <strong>connect your Slack account</strong> to General Task in Settings.
                </li>
                <li>
                    When connected, you can create a task from a Slack message by simply clicking the three dot menu on
                    any message.
                </li>
                <li>
                    Then, from the dropdown click the <strong>&quot;Create a task&quot;</strong> button.
                </li>
                <li>
                    Once you’ve created a task, it will appear in Slack in the{' '}
                    <strong>Services section of your Navigation Sidebar</strong> as well as your{' '}
                    <strong>Task Inbox.</strong>
                </li>
            </ul>
            <img width="100%" src="/images/nux-slack-task.png" />
        </Container>
    )
}

interface NUXTaskBodyProps {
    nux_number_id: number
    renderSettingsModal?: boolean
}
const NUXTaskBody = ({ nux_number_id }: NUXTaskBodyProps) => {
    switch (nux_number_id) {
        case 1:
            return <TaskToCal />
        case 2:
            return <FocusMode />
        case 3:
            return <Integrations />
        case 4:
            return <JohnsLetter />
        case 5:
            return <SlackTask />
        default:
            return null
    }
}

export const NuxTaskBodyStatic = ({ nux_number_id, renderSettingsModal }: NUXTaskBodyProps) => {
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    switch (nux_number_id) {
        case 1:
            return <TaskToCal />
        case 2:
            return <FocusMode />
        case 3:
            return (
                <>
                    {renderSettingsModal && (
                        <SettingsModal isOpen={isSettingsModalOpen} setIsOpen={setIsSettingsModalOpen} />
                    )}
                    <IntegrationsStaticContent
                        googleUrl="https://api.generaltask.com/link/google/"
                        githubUrl="https://api.generaltask.com/link/github/"
                        slackUrl="https://api.generaltask.com/link/slack/"
                        linearUrl="https://api.generaltask.com/link/linear/"
                        setIsSettingsModalOpen={setIsSettingsModalOpen}
                    />
                </>
            )
        case 4:
            return <JohnsLetterStaticContent />
        case 5:
            return <SlackTask />
        default:
            return null
    }
}

export default NUXTaskBody
