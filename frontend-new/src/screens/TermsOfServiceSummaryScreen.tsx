import React, { useEffect } from 'react'
import SingleViewTemplate from '../components/templates/SingleViewTemplate'
import ModalView from '../components/views/ModalView'
import TermsOfServiceView from '../components/views/TermsOfServiceSummaryView'
import { useAppDispatch } from '../redux/hooks'
import { setShowModal } from '../redux/tasksPageSlice'
import { ModalEnum } from '../utils/enums'

const TermsOfServiceSummaryScreen = () => {
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(setShowModal(ModalEnum.PRIVACY_POLICY))
    }, [])

    return (
        <SingleViewTemplate>
            <ModalView size="medium" canClose={false}>
                <TermsOfServiceView />
            </ModalView>
        </SingleViewTemplate>
    )
}

export default TermsOfServiceSummaryScreen
