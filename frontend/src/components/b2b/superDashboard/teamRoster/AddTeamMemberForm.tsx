import { FormEvent, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { useAddDashboardTeamMember } from '../../../../services/api/super-dashboard.hooks'
import { Spacing } from '../../../../styles'
import { icons } from '../../../../styles/images'
import Flex from '../../../atoms/Flex'
import GTInput from '../../../atoms/GTInput'
import GTButton from '../../../atoms/buttons/GTButton'

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
`

const AddTeamMemberForm = () => {
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [githubId, setGithubId] = useState('')

    const { mutate: addTeamMember } = useAddDashboardTeamMember()

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const id = uuidv4()
        addTeamMember({ optimisticId: id, id, name, email, github_id: githubId })
        setName('')
        setEmail('')
        setGithubId('')
        setShowForm(false)
    }

    if (!showForm) {
        return (
            <GTButton
                styleType="secondary"
                icon={icons.plus}
                value="Add team member"
                onClick={() => setShowForm(true)}
            />
        )
    }
    return (
        <Form onSubmit={handleSubmit}>
            <GTInput value={name} onChange={setName} placeholder="Name*" autoFocus />
            <GTInput value={email} onChange={setEmail} placeholder="Email" />
            <GTInput value={githubId} onChange={setGithubId} placeholder="GitHub username" />
            <Flex gap={Spacing._8}>
                <GTButton styleType="primary" value="Add team member" disabled={!name} />
                <GTButton styleType="secondary" value="Cancel" onClick={() => setShowForm(false)} />
            </Flex>
        </Form>
    )
}

export default AddTeamMemberForm
