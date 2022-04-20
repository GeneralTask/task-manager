import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Loading } from '@atoms'
import SingleViewTemplate from '../templates/SingleViewTemplate'
import ModalView from '../views/ModalView'
import TermsOfServiceView from '../views/TermsOfServiceSummaryView'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { useGetUserInfo } from '../../services/api-query-hooks'
import { ModalEnum } from '../../utils/enums'

const TermsOfServiceSummaryScreen = () => {
    const dispatch = useAppDispatch()
    const { data, isLoading } = useGetUserInfo()
    useEffect(() => {
        dispatch(setShowModal(ModalEnum.PRIVACY_POLICY))
    }, [])

    if (isLoading) return <Loading />
    if (!isLoading && data.agreed_to_terms) return <Navigate to="/" />
    return (
        <SingleViewTemplate>
            <ModalView size="medium" canClose={false}>
                <TermsOfServiceView />
            </ModalView>
        </SingleViewTemplate>
    )
}

export default TermsOfServiceSummaryScreen
