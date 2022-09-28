import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import BranchName from '../pull-requests/BranchName'
import { Status } from '../pull-requests/styles'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'

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
    margin: ${Spacing._16} 0;
    ${Typography.subtitle};
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const MarginHorizontal8 = styled.div`
    margin: 0 ${Spacing._8};
`
const MaxWidth200 = styled.div`
    max-width: 200px;
`
const InfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: ${Spacing._8};
    align-items: center;
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._8};
    ${Typography.bodySmall};
`
const Subtext = styled.span`
    margin-left: ${Spacing._16};
    color: ${Colors.text.light};
    ${Typography.mini};
`

interface PullRequestDetailsProps {
    pullRequest: TPullRequest
}
const PullRequestDetails = ({ pullRequest }: PullRequestDetailsProps) => {
    const { title, status, deeplink, branch } = pullRequest
    const { number, last_updated_at, author } = pullRequest
    const formattedTimeSince = getHumanTimeSinceDateTime(DateTime.fromISO(last_updated_at))

    return (
        <DetailsViewTemplate>
            <MarginHorizontal8>
                <DetailsTopContainer>
                    <Icon icon={logos.github} size="small" color="black" />
                    <Subtext>{`#${number} updated ${formattedTimeSince} by ${author}`}</Subtext>
                    <MarginLeftAuto>
                        <ExternalLinkButton link={deeplink} />
                    </MarginLeftAuto>
                </DetailsTopContainer>
                <TitleContainer>{title}</TitleContainer>
                <InfoContainer>
                    <Status type={status.color}>{status.text}</Status>
                    <MaxWidth200>
                        <BranchName name={branch} />
                    </MaxWidth200>
                </InfoContainer>
            </MarginHorizontal8>
        </DetailsViewTemplate>
    )
}

export default PullRequestDetails
