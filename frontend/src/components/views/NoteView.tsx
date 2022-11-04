import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { logos, noteBackground } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'
import { BodySmall, Header, Subtitle } from '../atoms/typography/Typography'

const MainContainer = styled.div`
    width: 100vw;
    height: 100vh;
    background: url(${noteBackground}) no-repeat center/100% fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
`
const Body = styled.div`
    width: 700px;
    height: 100vh;
    background: ${Colors.background.white};
    display: flex;
    flex-direction: column;
    padding: ${Spacing._64};
    gap: ${Spacing._32};
    overflow-y: auto;
`
const SignInButton = styled.div`
    position: absolute;
    top: ${Spacing._16};
    right: ${Spacing._16};
    width: 200px;
`
const GTLogo = styled.div`
    position: absolute;
    top: ${Spacing._12};
    left: ${Spacing._16};
`

const CompanyPolicyView = () => {
    const note = {
        id: '1',
        title: 'Real note (not a placeholder)',
        author: 'jack@generaltask.com',
        body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam mollis ac arcu id porta. Nulla mi felis, euismod ac faucibus porta, convallis eget arcu. Nulla sed odio a ex molestie scelerisque. Duis eu sem tellus. Duis rutrum eleifend pharetra. Nunc turpis erat, volutpat vel fringilla sit amet, lobortis a nunc. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse fringilla arcu at hendrerit tempus. Pellentesque id aliquam nunc, a lobortis nibh. Fusce rutrum eu dolor quis aliquet. Cras dignissim id lorem eget dapibus. Cras sit amet dui elit. Nunc elementum, eros vitae rutrum sodales, massa dui finibus neque, at lobortis odio diam eu leo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin elementum pretium turpis. Phasellus sollicitudin enim bibendum felis tempor vestibulum. Nulla sit amet consectetur nulla. Ut tincidunt mi metus, quis finibus ipsum luctus in. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    }

    return (
        <MainContainer>
            <GTLogo>
                <Icon icon={logos.generaltask_new} size="large" />
            </GTLogo>
            <SignInButton>
                <GoogleSignInButton />
            </SignInButton>
            <Body>
                <Header>{note.title}</Header>
                <Subtitle>{`From ${note.author}`}</Subtitle>
                <BodySmall>{note.body}</BodySmall>
            </Body>
        </MainContainer>
    )
}

export default CompanyPolicyView
