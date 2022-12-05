import { useState } from 'react'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import SettingsModal from './SettingsModal'

interface SettingsModalSettingsModalButtonProps {
    isCollapsed?: boolean
}
const SettingsModalButton = ({ isCollapsed = false }: SettingsModalSettingsModalButtonProps) => {
    const [modalIsOpen, setModalIsOpen] = useState(false)

    return (
        <>
            {isCollapsed ? (
                <GTIconButton
                    icon={icons.gear}
                    onClick={() => setModalIsOpen(true)}
                    tooltipText="Settings"
                    tooltipSide="right"
                />
            ) : (
                <GTButton
                    value="Settings"
                    styleType="secondary"
                    size="small"
                    fitContent={false}
                    onClick={() => setModalIsOpen(true)}
                />
            )}
            <SettingsModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
        </>
    )
}

export default SettingsModalButton
