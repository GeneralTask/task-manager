import { useState } from 'react'
import { icons } from '../../../styles/images'
import GTButton from '../../atoms/buttons/GTButton'
import GTModal from '../../mantine/GTModal'
import TeamRosterModalContent from './TeamRosterModalContent'

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
                    body: <TeamRosterModalContent />,
                }}
            />
        </>
    )
}

export default TeamRosterModalButton
