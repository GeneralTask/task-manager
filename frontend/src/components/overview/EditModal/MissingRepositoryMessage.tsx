import styled from 'styled-components'
import { GITHUB_SUPPORTED_TYPE_NAME } from '../../../constants'
import { useAuthWindow } from '../../../hooks'
import { useGetSupportedTypes } from '../../../services/api/settings.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import GTButton from '../../atoms/buttons/GTButton'

const TextContainerWidth = '40%'
const MessageContainer = styled.div`
    ${Typography.deprecated_bodySmall};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.mini};
    padding: ${Spacing._16};
    display: flex;
`
const Title = styled.div`
    ${Typography.deprecated_bold};
`
const TextContainer = styled.div`
    width: ${TextContainerWidth};
`
const Subtitle = styled.div`
    color: ${Colors.text.light};
`
const ButtonContainer = styled.div`
    margin-left: auto;
    margin-top: auto;
`

const MissingRepositoryMessage = () => {
    const { data: supportedTypes } = useGetSupportedTypes()
    const { openAuthWindow } = useAuthWindow()
    const githubAuthorizationUrl = supportedTypes?.find(
        (type) => type.name === GITHUB_SUPPORTED_TYPE_NAME
    )?.authorization_url
    if (!githubAuthorizationUrl) {
        return null
    }
    return (
        <MessageContainer>
            <TextContainer>
                <Title>Is a repository missing here?</Title>
                <Subtitle>
                    Make sure an admin for the relevant GitHub organization has granted access to General Task.
                </Subtitle>
            </TextContainer>
            <ButtonContainer>
                <GTButton
                    size="large"
                    value="Request access"
                    onClick={() => openAuthWindow({ url: githubAuthorizationUrl })}
                />
            </ButtonContainer>
        </MessageContainer>
    )
}

export default MissingRepositoryMessage
