import { Icon } from '../atoms/Icon'
import { TPullRequest } from '../../utils/types'
import { icons, logos } from '../../styles/images'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { Status } from '../pull-requests/styles'
import BranchName from '../pull-requests/BranchName'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import GTIconButton from '../atoms/buttons/GTIconButton'

const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 50px;
`
const TitleContainer = styled.div`
    background-color: inherit;
    color: ${Colors.text.black};
    font: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    margin-bottom: ${Spacing._16};
    ${Typography.subtitle};
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const MarginRight8 = styled.div`
    margin-right: ${Spacing._8};
`
const MaxWidth200 = styled.div`
    max-width: 200px;
`
const InfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    align-items: center;
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._8};
    ${Typography.bodySmall};
`

interface PullRequestDetailsProps {
    pullRequest: TPullRequest
}
const PullRequestDetails = ({ pullRequest }: PullRequestDetailsProps) => {
    const { title, status, deeplink, branch } = pullRequest

    return (
        <DetailsViewTemplate data-testid="details-view-container">
            <DetailsTopContainer>
                <MarginRight8>
                    <Icon icon={logos.github} size="small" color={Colors.icon.black} />
                </MarginRight8>
                <MarginLeftAuto>
                    <NoStyleAnchor href={deeplink} target="_blank" rel="noreferrer">
                        <GTIconButton icon={icons.external_link} />
                    </NoStyleAnchor>
                </MarginLeftAuto>
            </DetailsTopContainer>
            <TitleContainer>{title}</TitleContainer>
            <InfoContainer>
                <Status type={status.color}>{status.text}</Status>
                <MaxWidth200>
                    <BranchName name={branch} />
                </MaxWidth200>
            </InfoContainer>
        </DetailsViewTemplate>
    )
}

export default PullRequestDetails
