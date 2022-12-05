import { useState } from 'react'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import TooltipWrapper from '../atoms/TooltipWrapper'
import GTButton from '../atoms/buttons/GTButton'
import { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
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
                    <CollapsedIconContainer onClick={() => setModalIsOpen(true)}>
                        <Icon icon={icons.gear} />
                    </CollapsedIconContainer>
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
