import { useState } from 'react'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../mantine/GTModal'
import TeamRoster from './TeamRoster'

const TeamRosterModalButton = () => {
    const [showRosterModal, setShowRosterModal] = useState(false)
    return (
        <>
            <GTButton
                styleType="icon"
                icon={icons.gear}
                tooltipText="Manage your team roster"
                onClick={() => setShowRosterModal(true)}
            />
            <GTModal
                open={showRosterModal}
                setIsModalOpen={setShowRosterModal}
                tabs={{
                    title: 'Team Roster',
                    body: <TeamRoster />,
                }}
            />
        </>
    )
}

export default TeamRosterModalButton
