import styled from 'styled-components'
import { useGetDashboardTeamMembers } from '../../../../services/api/super-dashboard.hooks'
import { Spacing } from '../../../../styles'
import Flex from '../../../atoms/Flex'
import { Divider } from '../../../atoms/SectionDivider'
import Spinner from '../../../atoms/Spinner'
import { BodyMedium } from '../../../atoms/typography/Typography'
import AddTeamMemberForm from './AddTeamMemberForm'
import TeamMember from './TeamMember'

const TeamMemberList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
    max-height: 50vh;
    overflow-y: auto;
`

const TeamRosterModalContent = () => {
    const { data: teamMembers, isLoading } = useGetDashboardTeamMembers()

    if (isLoading) {
        return <Spinner />
    }
    return (
        <Flex column gap={Spacing._16}>
            <TeamMemberList>
                {!teamMembers || teamMembers.length === 0 ? (
                    <BodyMedium color="muted">No team members</BodyMedium>
                ) : (
                    teamMembers.map((teamMember) => <TeamMember key={teamMember.id} teamMember={teamMember} />)
                )}
            </TeamMemberList>
            <Divider />
            <AddTeamMemberForm />
        </Flex>
    )
}

export default TeamRosterModalContent
