import styled from 'styled-components'
import { useAuthWindow } from '../../hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TLogoImage, icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'

const BannerContainer = styled.div<{ hasBorder: boolean }>`
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid;
    border-color: ${(props) => (props.hasBorder ? Colors.gtColor.secondary : 'transparent')};
    border-radius: ${Border.radius.small};
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._8};
    height: 60px;
`
const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
`
const Title = styled.span`
    ${Typography.bodySmall};
`

interface AuthBannerProps {
    authorizationUrl: string
    name: string
    logo: TLogoImage
    hasBorder: boolean
    isGoogleSignIn?: boolean
}

const AuthBanner = ({ authorizationUrl, name, logo, hasBorder, isGoogleSignIn }: AuthBannerProps) => {
    const { openAuthWindow } = useAuthWindow()

    return (
        <BannerContainer hasBorder={hasBorder}>
            <IconContainer>
                <Icon icon={logos[logo]} />
                <Title>{`Connect ${name} to General Task`}</Title>
            </IconContainer>
            <div>
                <GTButton
                    value="Connect"
                    color={Colors.gtColor.primary}
                    icon={icons.external_link}
                    size="small"
                    styleType="secondary"
                    onClick={() => openAuthWindow({ url: authorizationUrl, isGoogleSignIn })}
                />
            </div>
        </BannerContainer>
    )
}

export default AuthBanner
