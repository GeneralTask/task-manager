import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import BranchName from '../pull-requests/BranchName'
import { Status } from '../pull-requests/styles'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import PullRequestComment from './pr/PullRequestComment'

const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
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
    color: ${Colors.text.light};
    ${Typography.label};
`
const BranchInfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`
const Green = styled.span`
    color: ${Colors.text.green};
    ${Typography.label};
    ${Typography.bold};
`
const Red = styled.span`
    color: ${Colors.text.red};
    ${Typography.label};
    ${Typography.bold};
`
const Gap4 = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._4};
`

interface PullRequestDetailsProps {
    pullRequest: TPullRequest
}
const PullRequestDetails = ({ pullRequest }: PullRequestDetailsProps) => {
    const { data: repositories } = useGetPullRequests()
    const repository = repositories?.find((repo) => repo.pull_requests.includes(pullRequest))

    const {
        title,
        status,
        deeplink,
        branch,
        number,
        last_updated_at,
        author,
        num_commits,
        base_branch,
        body,
        num_comments,
        comments,
        additions,
        deletions,
    } = pullRequest
    const formattedTimeSince = getHumanTimeSinceDateTime(DateTime.fromISO(last_updated_at))

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <Icon icon={logos.github} color="black" />
                <Subtext>{repository?.name}</Subtext>
                <MarginLeftAuto>
                    <ExternalLinkButton link={deeplink} />
                </MarginLeftAuto>
            </DetailsTopContainer>
            <TitleContainer>{title}</TitleContainer>
            <InfoContainer>
                <Status type={status.color}>{status.text}</Status>
                <Gap4>
                    <Green>{`+${additions}`}</Green>
                    <Red>{`-${deletions}`}</Red>
                </Gap4>
            </InfoContainer>
            <div>
                <Subtext>{`#${number} updated ${formattedTimeSince} by ${author}`}</Subtext>
                <Subtext>
                    <BranchInfoContainer>
                        {`#${author} wants to merge ${num_commits} commits into\u00A0`}
                        <BranchName name={base_branch} />
                        {`\u00A0from\u00A0`}
                        <BranchName name={branch} />
                    </BranchInfoContainer>
                </Subtext>
            </div>
            <Subtext>Description</Subtext>
            <PullRequestComment author={author} body={body} lastUpdatedAt={last_updated_at} isAuthorOfPR />
            <Divider color={Colors.border.extra_light} />
            <Subtext>{`Comments (${num_comments})`}</Subtext>
            {[...comments].reverse().map((c) => (
                <PullRequestComment
                    key={c.last_updated_at}
                    author={c.author}
                    body={c.body}
                    lastUpdatedAt={c.last_updated_at}
                    isAuthorOfPR={c.author === author}
                />
            ))}
        </DetailsViewTemplate>
    )
}

export default PullRequestDetails
