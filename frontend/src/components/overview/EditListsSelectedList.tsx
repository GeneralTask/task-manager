import { useDrag } from 'react-dnd'
import styled from 'styled-components'
import { useRemoveView } from '../../services/api/overview.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { DropItem, DropType, TOverviewView } from '../../utils/types'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { TemplateContainer } from '../atoms/TaskTemplate'
import { Truncated } from '../atoms/typography/Typography'
import ItemContainer from '../molecules/ItemContainer'
import { getOverviewAccordionHeaderIcon } from '../radix/OverviewAccordionItem'
import { EditViewsDeleteButton } from './styles'

const StyledItemContainer = styled(ItemContainer)`
    display: flex;
    width: 100%;
    padding: ${Spacing._12};
    box-sizing: border-box;
`
const TextContainer = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${Spacing._12};
    gap: ${Spacing._12};
    min-width: 0;
`

interface EditViewsSelectedViewProps {
    view: TOverviewView
    viewIndex: number
    onReorder: (item: DropItem, dropIndex: number) => void
}
const EditViewsSelectedView = ({ view, viewIndex, onReorder }: EditViewsSelectedViewProps) => {
    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.OVERVIEW_VIEW,
            item: { id: view.id, view },
        }),
        [view.id]
    )

    const { mutate: removeView } = useRemoveView()

    return (
        <ReorderDropContainer
            key={view.id}
            index={viewIndex}
            acceptDropType={DropType.OVERVIEW_VIEW}
            onReorder={onReorder}
            ref={drag}
        >
            <TemplateContainer isVisible>
                <StyledItemContainer key={view.id} ref={dragPreview}>
                    <Domino />
                    <TextContainer>
                        <Icon icon={getOverviewAccordionHeaderIcon(view.logo, view.task_section_id)} />
                        <Truncated>{view.name}</Truncated>
                    </TextContainer>
                    <EditViewsDeleteButton onClick={() => removeView({ id: view.id }, view.optimisticId)}>
                        <Icon icon={icons.trash} />
                    </EditViewsDeleteButton>
                </StyledItemContainer>
            </TemplateContainer>
        </ReorderDropContainer>
    )
}

export default EditViewsSelectedView
