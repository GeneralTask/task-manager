import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { checkboxSize } from '../../styles/dimensions'
import GTShadowContainer from '../atoms/GTShadowContainer'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import useOverviewLists from '../overview/useOverviewLists'

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    ${Typography.deprecated_body};
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._16};
`
const CardHeader = styled.div`
    display: flex;
    gap: ${Spacing._16};
    align-items: center;
    margin-bottom: ${Spacing._24};
`
const CardBody = styled.div`
    white-space: pre-wrap;
    margin-left: calc(${checkboxSize.parentContainer} + ${Spacing._16});
`
const SwitchText = styled.div`
    color: ${Colors.text.purple};
    cursor: pointer;
    user-select: none;
`
const mod = (n: number, m: number) => {
    return ((n % m) + m) % m
}
interface CardSwitcherProps {
    viewId: string
}

const CardSwitcher = ({ viewId }: CardSwitcherProps) => {
    const { lists } = useOverviewLists()
    const list = useMemo(() => lists?.find(({ id }) => id === viewId), [lists, viewId])

    const [cardIndex, setCardIndex] = useState(0)
    const card = useMemo(() => list?.view_items[cardIndex], [cardIndex, viewId, list])

    const onClickPrevious = () => {
        if (list == null) return
        const index = mod(cardIndex - 1, list.view_item_ids.length)
        if (index < 0) setCardIndex(list.view_item_ids.length - 1)
        else setCardIndex(index)
    }
    const onClickNext = () => {
        if (list == null) return
        const index = mod(cardIndex + 1, list.view_item_ids.length)
        if (index >= list.view_item_ids.length) setCardIndex(0)
        else setCardIndex(index)
    }

    if (!list || list.view_item_ids.length === 0 || !card) return null
    return (
        <div>
            <Header>
                <SwitchText onClick={onClickPrevious}>Previous</SwitchText>
                <div>
                    Task {cardIndex + 1} of {list.view_item_ids.length}
                </div>
                <SwitchText onClick={onClickNext}>Next</SwitchText>
            </Header>
            <GTShadowContainer>
                <CardHeader>
                    <MarkTaskDoneButton isDone={card.is_done} taskId={card.id} isSelected={false} />
                    {card.title}
                </CardHeader>
                <CardBody>{card.body}</CardBody>
            </GTShadowContainer>
        </div>
    )
}

export default CardSwitcher
