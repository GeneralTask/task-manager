import { useState } from 'react'
import { icons } from '../../styles/images'
import TooltipWrapper from '../atoms/TooltipWrapper'
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
                <TooltipWrapper dataTip="Settings" tooltipId="navigation-tooltip">
                    <GTIconButton icon={icons.gear} onClick={() => setModalIsOpen(true)} />
                </TooltipWrapper>
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
