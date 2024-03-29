import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { PULL_REQUEST_ACTIONS } from '../../utils/sortAndFilter/pull-requests.config'
import { TPullRequest } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import { BodySmall, BodySmallUpper } from '../atoms/typography/Typography'
import BranchName from '../pull-requests/BranchName'
import Status from '../pull-requests/Status'
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
    ${Typography.title.medium};
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
    ${Typography.body.medium};
`
const BranchInfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
`
const LinesModified = styled.span<{ color: 'green' | 'red' }>`
    color: ${(props) => Colors.text[props.color]};
    ${Typography.body.medium};
    ${Typography.bold};
`
const Gap4 = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._4};
`
const PaddingVertical24 = styled.div`
    padding: ${Spacing._24} 0;
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
        base_branch,
        body,
        num_comments,
        num_commits,
        comments,
        additions,
        deletions,
    } = pullRequest
    const formattedTimeSince = getHumanTimeSinceDateTime(DateTime.fromISO(last_updated_at))
    const statusDescription = PULL_REQUEST_ACTIONS.find((action) => action.text === status.text)?.description

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <Icon icon={logos.github} color="black" />
                <BodySmall color="light">{repository?.name}</BodySmall>
                <MarginLeftAuto>
                    <ExternalLinkButton link={deeplink} />
                </MarginLeftAuto>
            </DetailsTopContainer>
            <TitleContainer>{title}</TitleContainer>
            <InfoContainer>
                <Status description={statusDescription} status={status.text} color={status.color} />
                <Gap4>
                    <LinesModified color="green">{`+${additions}`}</LinesModified>
                    <LinesModified color="red">{`-${deletions}`}</LinesModified>
                </Gap4>
            </InfoContainer>
            <BodySmall color="light">{`#${number} updated ${formattedTimeSince} by ${author} (${num_commits} commits)`}</BodySmall>
            <BranchInfoContainer>
                <BranchName name={base_branch} />
                <BodySmall color="light">from</BodySmall>
                <BranchName name={branch} />
            </BranchInfoContainer>
            <PaddingVertical24>
                <Divider color={Colors.background.border} />
            </PaddingVertical24>
            <BodySmallUpper color="light">Description</BodySmallUpper>
            <PullRequestComment author={author} body={body} lastUpdatedAt={last_updated_at} isAuthorOfPR />
            {num_comments > 0 && (
                <>
                    <PaddingVertical24>
                        <Divider color={Colors.background.border} />
                    </PaddingVertical24>
                    <BodySmallUpper color="light">{`Comments (${num_comments})`}</BodySmallUpper>
                    {comments
                        .slice()
                        .sort((a, b) => +DateTime.fromISO(a.last_updated_at) - +DateTime.fromISO(b.last_updated_at))
                        .map((c) => (
                            <PullRequestComment
                                key={`${c.last_updated_at}${c.body}`}
                                author={c.author}
                                body={c.body}
                                lastUpdatedAt={c.last_updated_at}
                                isAuthorOfPR={c.author === author}
                            />
                        ))}
                </>
            )}
        </DetailsViewTemplate>
    )
}

export default PullRequestDetails
