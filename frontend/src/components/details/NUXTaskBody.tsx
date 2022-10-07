import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { GITHUB_SUPPORTED_TYPE_NAME } from '../../constants'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { TTask } from '../../utils/types'
import Spinner from '../atoms/Spinner'

const Container = styled.div<{ isFullHeight?: boolean; minHeight?: number }>`
    background-color: inherit;
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid transparent;
    border-radius: ${Border.radius.small};
    width: 100%;
    padding: ${Spacing._8};
    ${Typography.bodySmall};
    :hover {
        box-shadow: ${Shadows.light};
        background-color: ${Colors.background.white};
        border-color: ${Colors.border.light};
    }
`

const TaskToCal = () => {
    return (
        <Container>
            Welcome to General Task! We’ve created a few sample tasks to help you get a feel for things.
            <p>
                First up, we have Task-to-Calendar. This helps you get your tasks done by setting aside time for them on
                your calendar. Try dragging this task to the calendar on the right to give it a shot — any tasks you
                drag will appear on your Google Calendar.
            </p>
            <p>
                Next, we’ll take a look at how to shut out distractions with Focus Mode. Click the checkbox to mark this
                task as done whenever you’re ready.
            </p>
            <video width="100%" autoPlay loop>
                <source src="/video/task-to-cal.mp4" type="video/mp4" />
            </video>
        </Container>
    )
}

const FocusMode = () => {
    return (
        <Container>
            Distractions can make it difficult to get things done, so we’ve created Focus Mode to help you keep your
            attention on the things you care about. To use it, click Enter Focus Mode to immerse yourself in one thing
            at a time. Any events on your calendar will take center stage, including tasks you’ve put there using
            Task-to-Calendar. This way, you’ll have easy access to task details, and can join meetings in just one
            click.
            <p>
                If you don’t have anything planned on your calendar, Focus Mode can also help you decide what to work on
                next. This way, you can leave it open throughout your day and always have a clear sense of what to work
                on next.
            </p>
            <p>
                Pro tip: Try pinning this tab in your browser for easy access, or keep it on a second monitor to get
                details about your day at a quick glance.
            </p>
            <img src="/images/nux-focus-mode.png" width="100%" />
        </Container>
    )
}

const Integrations = () => {
    const { data: supportedTypes } = useGetSupportedTypes()
    console.log({ supportedTypes })
    const githubUrl = supportedTypes?.find((type) => type.name === GITHUB_SUPPORTED_TYPE_NAME)?.authorization_url
    const linearUrl = supportedTypes?.find((type) => type.name === 'Linear')?.authorization_url
    const slackUrl = supportedTypes?.find((type) => type.name === 'Slack')?.authorization_url

    return (
        <Container>
            We want to make it easy for you to get a bird’s-eye view of your day, so we integrate with other services to
            reduce the need to jump from site to site.
            <ul>
                <li>
                    <a href={githubUrl}>Connect to GitHub</a> to see which pull requests you can take action on.
                </li>
                <li>
                    <a href={linearUrl}>Connect to Linear</a> to see and update the issues assigned to you.
                </li>
                <li>
                    <a href={slackUrl}>Connect to Slack</a> for the ability to turn any message into a task on the spot.
                </li>
            </ul>
            <p>
                You can find the full list via the Settings button in the lower left corner of the screen. (We’re just
                getting started — if there are integrations you want to see, use the Share feedback button in the lower
                right to let us know what you’d like to see next.)
            </p>
            <Link to="/settings">
                <img src="/images/nux-integrations.png" width="100%" />
            </Link>
        </Container>
    )
}

const JohnsLetter = () => {
    const { data: userInfo } = useGetUserInfo()
    if (!userInfo) return <Spinner />
    const firstName = userInfo.name.split(' ')[0]
    return (
        <Container>
            Hi {firstName},
            <p>
                Thank you for choosing General Task! We know that there are many productivity solutions on the market,
                and we are truly honored that you landed on us.
            </p>
            <p>
                We have spent the last year building what we believe to be the best productivity solution on the market
                for software engineers. And it’s free! We don’t limit our software to those who can afford to pay
                $30+/month, like many of our competitors do. At General Task, we believe that everyone, not just a
                select few, should have access to the very best productivity tools and services. That means we will be
                keeping our personal productivity solution <b>free forever</b>.
            </p>
            <p>
                Productivity is close to our hearts. Our team has worked at some of the most successful companies in the
                industry: Meta, Google, Netflix, Robinhood, as well as many other smaller companies. We learned a lot
                and had a good time, but we also saw the downside of working at such companies: pointless meetings,
                constant distractions and waiting way too long to get your code reviewed, among many other issues.
            </p>
            <p>
                We know how crappy it can feel to have an unproductive day and how awesome it can feel to be super
                productive day. We want to make those awesome days happen all the time. That’s why we built this. We use
                General Task in-house daily, and we are already seeing substantial improvements in our own productivity.
                It feels great. We hope you enjoy the tool as much as we do!
            </p>
            <p>
                General Task, as it is currently available, is in beta. This means that it is an imperfect work in
                progress, but will improve rapidly to help you be more and more productive over time. We are just
                getting started, and we can’t wait to have you along for the ride.
            </p>
            <p>
                <b>But we can’t do this alone!</b>
            </p>
            <p>
                We are committed to listening to each and every one of your ideas, and will work tirelessly to improve
                our software as much as possible, as fast as possible. Please send us any bugs you notice, or product
                ideas you’d like to see in the app. Anything helps!
            </p>
            <p>
                Reach out to us with any questions, comments, or concerns at{' '}
                <a href="mailto:julian@generaltask.com">julian@generaltask.com</a> or{' '}
                <a href="mailto:john@generaltask.com">john@generaltask.com</a>.
            </p>
            <p>Happy building!</p>
            <p>Julian and John</p>
        </Container>
    )
}

interface NUXTaskBodyProps {
    task: TTask
}
const NUXTaskBody = ({ task }: NUXTaskBodyProps) => {
    switch (task.nux_number_id) {
        case 1:
            return <TaskToCal />
        case 2:
            return <FocusMode />
        case 3:
            return <Integrations />
        case 4:
            return <JohnsLetter />
        default:
            return null
    }
}

export default NUXTaskBody
