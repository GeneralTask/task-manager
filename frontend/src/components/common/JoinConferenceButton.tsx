import React from 'react'
import styled from 'styled-components'
import { TConferenceCall } from '../../helpers/types'

const JointButtonContainer = styled.div`
    background: #3F3F46;
    padding: 6px 15px;
    border-radius: 10px;
    margin-left: 10px;
`
const Logo = styled.img`
    max-height: 16px;
`
const JoinConferenceHeader = styled.div`
    display: flex;
    align-items: center;
    font-size: 13px;
    justify-content: space-between;
    color: white;
    gap: 3px;
`
const Link = styled.a`
    text-decoration: none;
    margin-left: auto;
`

interface Props {
    conferenceCall: TConferenceCall
}
function JoinConferenceButton({ conferenceCall }: Props): JSX.Element {
    return (
        <Link href={conferenceCall.url} target="_blank" onClick={(e) => e.stopPropagation()}>
            <JointButtonContainer>
                <JoinConferenceHeader>
                    <div>Join</div>
                    <Logo src={conferenceCall.logo} />
                </JoinConferenceHeader>
            </JointButtonContainer>
        </Link>
    )
}

export default JoinConferenceButton
