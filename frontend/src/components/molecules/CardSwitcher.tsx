import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { checkboxSize } from '../../styles/dimensions'
import { TOverviewItem } from '../../utils/types'
import GTShadowContainer from '../atoms/GTShadowContainer'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    ${Typography.body};
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
    const { data: views } = useGetOverviewViews()
    const [cardIndex, setCardIndex] = useState(0)
    const [card, setCard] = useState<TOverviewItem | null>(null)

    useEffect(() => {
        const view = views?.find(({ id }) => id === viewId)
        if (view == null) return
        if (cardIndex >= view.view_items.length) {
            setCardIndex(0)
            setCard(view.view_items[0])
        } else {
            setCard(view.view_items[cardIndex])
        }
    }, [cardIndex, viewId, views])

    const view = views?.find(({ id }) => id === viewId)
    if (!view || view.view_items.length === 0) return null
    if (card == null) return null
    return (
        <div>
            <Header>
                <SwitchText onClick={() => setCardIndex(mod(cardIndex - 1, view.view_items.length))}>
                    Previous
                </SwitchText>
                <div>
                    Task {cardIndex + 1} of {view.view_items.length}
                </div>
                <SwitchText onClick={() => setCardIndex(mod(cardIndex + 1, view.view_items.length))}>Next</SwitchText>
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
