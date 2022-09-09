import { useState } from 'react'
import GTButton from '../atoms/buttons/GTButton'
import FeedbackView from '../views/FeedbackView'

const FeedbackButton = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    return (
        <>
            <GTButton
                value="Share feedback"
                styleType="secondary"
                fitContent={false}
                onClick={() => setModalIsOpen(true)}
            />
            <FeedbackView modalIsOpen={modalIsOpen} setModalIsOpen={setModalIsOpen} />
        </>
    )
}

export default FeedbackButton
