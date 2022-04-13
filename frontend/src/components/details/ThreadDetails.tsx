import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TEmailThread } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import EmailTemplate from './EmailTemplate'

const FlexColumnContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
`
const HeaderContainer = styled.div`
    flex: 1;
    display: flex;
    height: 100px;
    padding: ${Spacing.padding._16}px;
    align-items: center;
`
const HeaderTitleContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`
const Title = styled.span`
    margin-left: ${Spacing.margin._8}px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Switzer-Variable;
    font-size: ${Typography.small.fontSize};
    color: ${Colors.gray._600};
`
const SubTitle = styled(Title)`
    font-size: ${Typography.xSmall.fontSize};
    color: ${Colors.gray._400};
`
interface ThreadDetailsProps {
    thread: TEmailThread | undefined
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {

    const title = `${thread?.emails[0]?.subject} (${thread?.emails.length})`
    const people = Array.from(new Set(thread?.emails.map((email) => (email.recipients.to)).flat().map((recipient) => (recipient.email))))

    return (
        <FlexColumnContainer>
            <HeaderContainer>
                <Icon size={'medium'} source={logos.gmail} />
                <HeaderTitleContainer>
                    <Title>{title}</Title>
                    <SubTitle>{`To: ${people.join(', ')}`}</SubTitle>
                </HeaderTitleContainer>
            </HeaderContainer>
            {
                thread && thread.emails.map((email, index) => (
                    <EmailTemplate
                        key={index}
                        sender={email.sender.name}
                        // subtitle={<EmailSenderDetails sender={email.sender} recipients={email.recipients} />}
                        body={email.body}
                        collapsed={index !== thread.emails.length - 1}
                    />
                ))
            }
        </FlexColumnContainer>
    )
}

export default ThreadDetails
