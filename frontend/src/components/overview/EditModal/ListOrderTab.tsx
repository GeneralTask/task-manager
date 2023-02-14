import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useGTLocalStorage } from '../../../hooks'
import { useGetOverviewViews, useReorderViews } from '../../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../../styles'
import { DropItem, DropType } from '../../../utils/types'
import Flex from '../../atoms/Flex'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import { Divider } from '../../atoms/SectionDivider'
import { Body } from '../../atoms/typography/Typography'
import EditListsSelectedList from './EditListsSelectedList'
import ListModalPreference from './ListModalPreference'
import SmartPrioritize, { SmartPrioritizeState } from './SmartPrioritize'

const PositionedDivider = styled(Divider)`
    margin-top: ${Spacing._24};
`
const PreferencesContainer = styled.div`
    margin-top: ${Spacing._16};
    margin-left: ${Spacing._16};
`
const PreferencesTitle = styled(Body)`
    ${Typography.bold}
`

const ListOrderTab = () => {
    const [smartPrioritizeState, setSmartPrioritizeState] = useState<SmartPrioritizeState>(SmartPrioritizeState.MANUAL)
    const { data: lists } = useGetOverviewViews()
    const [automaticSortEmpty, setAutomaticSortEmpty] = useGTLocalStorage('overviewAutomaticEmptySort', false, true)
    const { mutate: reorderViews } = useReorderViews()

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) =>
            reorderViews({ id: item.id, idOrdering: dropIndex }, item.view?.optimisticId),
        [reorderViews]
    )
    const preferenceSubtext = `Once a list that was previously empty or completed is filled with items again, it${'\n'}will return to its original position.`
    return (
        <Flex column flex="1">
            <SmartPrioritize state={smartPrioritizeState} setState={setSmartPrioritizeState} />
            {!smartPrioritizeState &&
                lists?.map((view, index) => (
                    <EditListsSelectedList key={view.id} view={view} viewIndex={index} onReorder={handleReorder} />
                ))}
            <ReorderDropContainer
                index={lists?.length ?? 0}
                acceptDropType={DropType.OVERVIEW_VIEW}
                onReorder={handleReorder}
                indicatorType="TOP_ONLY"
            />
            <PositionedDivider color={Colors.border.light} />
            <PreferencesContainer>
                <PreferencesTitle>Preferences</PreferencesTitle>
                <ListModalPreference
                    text="Move empty or completed lists to the bottom of Daily Overview"
                    subtext={preferenceSubtext}
                    onClick={() => setAutomaticSortEmpty(!automaticSortEmpty)}
                    isChecked={automaticSortEmpty}
                />
            </PreferencesContainer>
        </Flex>
    )
}

export default ListOrderTab
