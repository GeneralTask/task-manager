import React from 'react'
import styled from 'styled-components'
import { Margin } from '../../helpers/styles'
import { TConferenceCall } from '../../helpers/types'
import GTButton from '../common/GTButton'

const Logo = styled.img`
    max-height: 16px;
    margin-right: 6px;
`
const JoinConference = styled.div`
    display: flex;
    align-items: center;
    font-size: 16px;
`
const Link = styled.a`
    text-decoration: none;
`

interface Props {
    conferenceCall: TConferenceCall,
}

function JoinConferenceButton({ conferenceCall }: Props): JSX.Element {
    return <Link href={conferenceCall.url} target="_blank" onClick={(e) => e.stopPropagation()}>
        <GTButton theme="black" margin={Margin.ml10} >
            <JoinConference>
                <Logo src={conferenceCall.logo} />
                Join Meeting
            </JoinConference>
        </GTButton>
    </Link>
}

export default JoinConferenceButton
