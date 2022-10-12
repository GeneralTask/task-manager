import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import GTModal from '../atoms/GTModal'
import Loading from '../atoms/Loading'
import SingleViewTemplate from '../templates/SingleViewTemplate'
import TermsOfServiceView from '../views/TermsOfServiceSummaryView'

const TermsOfServiceSummaryScreen = () => {
    const [modalIsOpen, setModalIsOpen] = useState(true)
    const { data, isLoading } = useGetUserInfo()

    if (isLoading) return <Loading />
    if (!isLoading && data?.agreed_to_terms) return <Navigate to="/" />
    return (
        <SingleViewTemplate>
            <GTModal
                isOpen={modalIsOpen}
                canClose={false}
                onClose={() => setModalIsOpen(false)}
                type="medium"
                shouldCloseOnOverlayClick={false}
            >
                <TermsOfServiceView />
            </GTModal>
        </SingleViewTemplate>
    )
}

export default TermsOfServiceSummaryScreen
