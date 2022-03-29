import { TRecipient, TRecipients, TSender } from "../../utils/types"

import { Icon } from "../atoms/Icon"
import { Images } from "../../styles"
import { Text } from "react-native"
import { margin } from "../../styles/spacing"
import styled from "styled-components/native"
import { useState } from "react"

const Container = styled.View`
    margin-top: ${margin.xSmall}px;
`
const Row = styled.View`
    display: flex;
    flex-direction: row;
    width: 100%;
`
const KeyContainer = styled.Text`
    display: flex;
    flex-direction: row;
    width: 10%;
    color: gray;
`
const ValueContainer = styled.Text`
    display: flex;
    flex-direction: row;
    width: 89%;
`
const Bold = styled.Text`
    font-weight: bold;
    margin: 0;
`
const ExpandCollapse = styled.Pressable`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
`

interface EmailSenderDetailsProps {
    sender: TSender
    recipients: TRecipients
}

const EmailSenderDetails = ({ sender, recipients }: EmailSenderDetailsProps) => {
    const [showDetails, setShowDetails] = useState(false)

    const fromDetails = <Row>
        <KeyContainer>From:</KeyContainer>
        {sender.name
            ? <ValueContainer>
                <Bold>{sender.name} </Bold>
                {`<${sender.email}>`}
            </ValueContainer>
            : <ValueContainer>
                <Bold>{sender.email}</Bold>
            </ValueContainer>}
    </Row >

    const restOfDetails = !showDetails
        ? <Row>
            <KeyContainer>To:</KeyContainer>
            <ValueContainer>
                <Text>
                    {recipients.to.map(({ name, email }) => name || email).join(", ")}
                </Text>
            </ValueContainer>
        </Row>
        : <>
            <RecipientDetails category="To:" recipients={recipients.to} />
            <RecipientDetails category="Cc:" recipients={recipients.cc} />
            <RecipientDetails category="Bcc:" recipients={recipients.bcc} />
        </>

    return <Container>
        {fromDetails}
        {restOfDetails}
        <ExpandCollapse onPress={() => setShowDetails(!showDetails)} >
            {showDetails
                ? <Icon size="small" source={Images.icons.chevron_up} />
                : <Icon size="small" source={Images.icons.chevron_down} />
            }
        </ExpandCollapse>
    </Container>
}

interface RecipientDetailsProps {
    category: string
    recipients: TRecipient[]
}
function RecipientDetails({ category, recipients }: RecipientDetailsProps): JSX.Element {
    return <>
        {recipients.map(({ name, email }, index) => {
            return <Row key={index}>
                <KeyContainer>{index === 0 && category}</KeyContainer>
                <ValueContainer>
                    <Text>{name ? `${name} <${email}>` : email}</Text>
                </ValueContainer>
            </Row>
        })}
    </>
}

// if (name) {
//     return `${name} <${email}>`
// } else {
//     return email
// }

export default EmailSenderDetails
