import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Loading from '../atoms/Loading'
import SingleViewTemplate from '../templates/SingleViewTemplate'
import TermsOfServiceView from '../views/TermsOfServiceSummaryView'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import GTModal from '../atoms/GTModal'

const TermsOfServiceSummaryScreen = () => {
    const [modalIsOpen, setModalIsOpen] = useState(true)
    const { data, isLoading } = useGetUserInfo()

    if (isLoading) return <Loading />
    if (!isLoading && data.agreed_to_terms) return <Navigate to="/" />
    return (
        <SingleViewTemplate>
            <GTModal isOpen={modalIsOpen} canClose={false} onClose={() => setModalIsOpen(false)}>
                <TermsOfServiceView />
            </GTModal>
        </SingleViewTemplate>
    )
}

export default TermsOfServiceSummaryScreen
