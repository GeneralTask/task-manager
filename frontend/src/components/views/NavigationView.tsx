import React, { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { useAddTaskSection, useGetLinkedAccounts, useGetTasks } from '../../services/api-query-hooks'
import { Border, Colors } from '../../styles'
import { icons } from '../../styles/images'
import { margin, padding } from '../../styles/spacing'
import { weight } from '../../styles/typography'
import { authSignOut } from '../../utils/auth'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import NoStyleInput from '../atoms/NoStyleInput'
import FeedbackButton from '../molecules/FeedbackButton'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'


const NavigationViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 232px;
    background-color: ${Colors.gray._100};
    padding: ${padding._8}px;
    box-sizing: border-box;
`
const NavigationViewHeader = styled.div`
    height: 24px;
    width: 100%;
    margin-bottom: ${margin._16}px;
`
const AddSectionView = styled.div`
    display: flex;
    flex-direction: row;
    padding: ${padding._4}px ${padding._8}px;
    border-radius: ${Border.radius.small};
    border-width: 2px;
    border-style: solid;
    border-color: transparent;
    align-items: center;
`
const IconWidth = styled.div`
    width: fit-content;
`
const AddSectionInputView = styled.div`
    font-weight: ${weight._600};
    margin-left: ${margin._8}px;
    flex: 1;
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${margin._8}px;
    padding-bottom: ${padding._8}px;
    margin-top: auto;
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections } = useGetTasks()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { section: sectionIdParam, account: accountIdParam } = useParams()
    const [sectionName, setSectionName] = useState('')
    const { mutate: addTaskSection } = useAddTaskSection()
    const { pathname } = useLocation()

    return (
        <NavigationViewContainer>
            <NavigationViewHeader>
                <Icon size="medium" />
            </NavigationViewHeader>
            {(taskSections !== undefined && linkedAccounts !== undefined) ? <NavigationSectionLinks
                taskSections={taskSections}
                linkedAccounts={linkedAccounts}
                sectionId={sectionIdParam || ''}
                accountId={accountIdParam || ''}
                pathName={pathname}
            /> :

                <Loading />
            }
            <AddSectionView>
                <IconWidth>
                    <Icon size="small" source={icons.plus} />
                </IconWidth>
                <AddSectionInputView>
                    <NoStyleInput
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder={'Add Section'}
                        onSubmit={() => {
                            setSectionName('')
                            addTaskSection({ name: sectionName })
                        }}
                    />
                </AddSectionInputView>

            </AddSectionView>
            <GapView>
                <FeedbackButton />
                <RoundedGeneralButton value="Sign Out" textStyle="dark" onPress={() => authSignOut(dispatch)} />
            </GapView>
        </NavigationViewContainer>
    )
}

export default NavigationView
