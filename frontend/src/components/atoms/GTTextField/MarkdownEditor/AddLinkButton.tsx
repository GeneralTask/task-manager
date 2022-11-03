import { useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import { icons } from '../../../../styles/images'
import TooltipWrapper from '../../TooltipWrapper'
import ToolbarButton from './ToolbarButton'

interface AddLinkButonProps {
    isLinkSelected: boolean
}

const AddLinkButton = ({ isLinkSelected }: AddLinkButonProps) => {
    const [showLinkInput, setShowLinkInput] = useState(false)
    useEffect(() => {
        // ReactTooltip.rebuild()
        return () => {
            ReactTooltip.hide()
        }
    }, [])
    return (
        <TooltipWrapper tooltipId="tooltip" dataTip={'hi'} forceShow={showLinkInput}>
            <ToolbarButton
                icon={icons.link}
                isActive={isLinkSelected}
                action={() => setShowLinkInput(true)}
                title="Add link"
            />
        </TooltipWrapper>
    )
}

export default AddLinkButton
