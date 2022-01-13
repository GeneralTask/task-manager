import React, { useCallback, useEffect, useState } from 'react'
import { emptyFunction, getLinkedAccountsURL, makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import Account from './Account'
import AddNewAccountDropdown from './AddNewAccountDropdown'
import DotSpinner from '../common/DotSpinner'
import { LINKED_ACCOUNTS_URL } from '../../constants'
import { TLinkedAccount } from '../../helpers/types'
import { setLinkedAccounts } from '../../redux/userDataSlice'
import styled from 'styled-components'
import { AbortID } from '../../helpers/enums'

const FETCH_LINKED_ACCOUNTS_INTERVAL = 1000 * 30 // every thirty seconds
const AccountsContainer = styled.div`
	display: flex;
	flex-direction: column;
`
const AccountsHeader = styled.div`
	display: flex;
	justify-content: space-between;
`
const AccountsHeaderText = styled.div`
	font-size: 1.5em; 
	font-weight: bold;
	min-width: 290px;
`
const AccountsBody = styled.div`
	margin-top: 20px;
`

export const useFetchLinkedAccounts = (
	setIsLoading: (x: boolean) => void = emptyFunction,
): () => Promise<void> => {
	const dispatch = useAppDispatch()
	return useCallback(async () => {
		try {
			setIsLoading(true)
			const response = await makeAuthorizedRequest({
				url: LINKED_ACCOUNTS_URL,
				method: 'GET',
				abortID: AbortID.LINKED_ACCOUNTS,
			})
			if (response.ok) {
				const accounts: TLinkedAccount[] = await response.json()
				dispatch(setLinkedAccounts(accounts))
			}
		} catch (e) {
			console.log({ e })
		} finally {
			setIsLoading(false)
		}

	}, [dispatch, setIsLoading])
}

const Accounts: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true)
	const linkedAccounts = useAppSelector((state) => state.user_data.linked_accounts)
	const dispatch = useAppDispatch()
	const fetchLinkedAccounts = useFetchLinkedAccounts(setIsLoading)

	useEffect(() => {
		fetchLinkedAccounts()
		const interval = setInterval(() => { fetchLinkedAccounts() }, FETCH_LINKED_ACCOUNTS_INTERVAL)
		return () => {
			clearInterval(interval)
		}
	}, [])

	async function removeLink(
		account: TLinkedAccount,
	) {
		const confirmation = confirm(`Are you sure you want to unlink your ${account.name} account (${account.display_id})?`)
		if (confirmation) {
			const newAccounts = linkedAccounts.filter((linkedAccount: TLinkedAccount) => linkedAccount.id != account.id)

			dispatch(setLinkedAccounts(newAccounts))

			await makeAuthorizedRequest({
				url: getLinkedAccountsURL(account.id),
				method: 'DELETE',

			})
			await fetchLinkedAccounts()
		}
	}

	if (isLoading && linkedAccounts.length === 0) return <DotSpinner />
	else if (linkedAccounts.length === 0) {
		return (
			<AccountsContainer>
				<AccountsHeader>
					<AccountsHeaderText>No linked accounts!</AccountsHeaderText>
					<AddNewAccountDropdown refetchLinkedAccounts={() => { fetchLinkedAccounts() }} />
				</AccountsHeader>
			</AccountsContainer>
		)
	}
	else {
		return (
			<AccountsContainer>
				<AccountsHeader>
					<AccountsHeaderText>Accounts</AccountsHeaderText>
					<AddNewAccountDropdown refetchLinkedAccounts={() => { fetchLinkedAccounts() }} />
				</AccountsHeader>
				<AccountsBody>
					{linkedAccounts.map(((account, index) =>
						<Account linkedAccount={account} key={index} removeLink={() => { removeLink(account) }} />
					))}
				</AccountsBody>
			</AccountsContainer>
		)
	}
}

export default Accounts
