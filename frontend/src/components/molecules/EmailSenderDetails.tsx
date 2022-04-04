import { Colors, Images } from "../../styles"
import { TRecipient, TRecipients, TSender } from "../../utils/types"
import { useEffect, useState } from "react"

import { Icon } from "../atoms/Icon"
import { Text } from "react-native"
import { margin } from "../../styles/spacing"
import styled from "styled-components/native"

const Container = styled.View`
    margin-top: ${margin._4}px;
`
const Row = styled.View`
    display: flex;
    flex-direction: row;
`
const KeyContainer = styled.Text`
    display: flex;
    flex-direction: row;
    width: 10%;
    color: ${Colors.gray._600};
`
const ValueContainer = styled.Text`
    display: flex;
    flex-direction: row;
`
const Bold = styled.Text`
    font-weight: bold;
`
const ExpandCollapse = styled.Pressable`
    display: flex;
    flex-direction: row;
    justify-content: center;
`

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

interface EmailSenderDetailsProps {
    sender: TSender | string
    recipients: TRecipients
}

const EmailSenderDetails = ({ sender, recipients }: EmailSenderDetailsProps) => {
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        setShowDetails(false)
    }, [sender, recipients])

    const senderDisplayText = typeof sender === 'string'
        ? sender
        : <>
            <Bold>{sender.name} </Bold>{`<${sender.email}>`}
        </>
    const senderDetailsRow = <Row>
        <KeyContainer>From:</KeyContainer>
        <ValueContainer>{senderDisplayText}</ValueContainer>
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
        {senderDetailsRow}
        {restOfDetails}
        <ExpandCollapse onPress={() => setShowDetails(!showDetails)} >
            {showDetails
                ? <Icon size="small" source={Images.icons.chevron_up} />
                : <Icon size="small" source={Images.icons.chevron_down} />
            }
        </ExpandCollapse>
    </Container>
}

export default EmailSenderDetails
