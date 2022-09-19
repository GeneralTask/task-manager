import { TConferenceCall } from '../../../utils/types'
import NoStyleAnchor from '../NoStyleAnchor'
import GTButton from './GTButton'

interface JoinMeetingButtonProps {
    conferenceCall: TConferenceCall
    shortened?: boolean
}

const JoinMeetingButton = ({ conferenceCall, shortened = true }: JoinMeetingButtonProps) => {
    const message = shortened ? 'Join' : 'Join Meeting'
    return (
        <NoStyleAnchor href={conferenceCall.url} target="_blank">
            <GTButton icon={conferenceCall.logo} iconColor="black" styleType="secondary" value={message} />
        </NoStyleAnchor>
    )
}

export default JoinMeetingButton
