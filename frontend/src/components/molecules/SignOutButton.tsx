import { authSignOut } from '../../utils/auth'
import GTButton from '../atoms/buttons/GTButton'
import GTDialog from '../radix/GTDialog'

const SignOutButton = () => {
    return (
        <GTDialog
            title="Sign out?"
            actions={<GTButton value="Sign Out" styleType="primary" onClick={() => authSignOut()} />}
            trigger={<GTButton styleType="primary" value="Sign Out" />}
        />
    )
}

export default SignOutButton
