import { useState } from 'react'
import styled from 'styled-components'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { checkboxSize } from '../../styles/dimensions'
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
    const [currentCard, setCurrentCard] = useState(0)

    const view = views?.find(({ id }) => id === viewId)
    if (!view || view.view_items.length === 0) {
        return null
    }
    const currentTask = view.view_items[currentCard]
    return (
        <div>
            <Header>
                <SwitchText onClick={() => setCurrentCard(mod(currentCard - 1, view.view_items.length))}>
                    Previous
                </SwitchText>
                <div>
                    Task {currentCard + 1} of {view.view_items.length}
                </div>
                <SwitchText onClick={() => setCurrentCard(mod(currentCard + 1, view.view_items.length))}>
                    Next
                </SwitchText>
            </Header>
            <GTShadowContainer>
                <CardHeader>
                    <MarkTaskDoneButton isDone={currentTask.is_done} taskId={currentTask.id} isSelected={false} />
                    {view.view_items[currentCard].title}
                </CardHeader>
                <CardBody>{view.view_items[currentCard].body}</CardBody>
            </GTShadowContainer>
        </div>
    )
}

export default CardSwitcher
