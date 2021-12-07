import React, { useCallback, useEffect, useState } from 'react'
import { emptyFunction, getLinkedAccountsURL, makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import Account from './Account'
import AddNewAccountDropdown from './AddNewAccountDropdown'
import DotSpinner from '../common/DotSpinner'
import { LINKED_ACCOUNTS_URL } from '../../constants'
import { TLinkedAccount } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import { setLinkedAccounts } from '../../redux/settingsSlice'

const FETCH_LINKED_ACCOUNTS_INTERVAL = 1000 * 30 // every thirty seconds

const Accounts: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true)
	const linkedAccounts = useAppSelector((state) => state.settings_page.linked_accounts)
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

	if (isLoading && linkedAccounts.length === 0) {
		return <DotSpinner />
	}
	else if (linkedAccounts.length === 0) {
		return (
			<>
				<flex.centerXY>
					<h2>No linked accounts!</h2>
					<AddNewAccountDropdown refetchLinkedAccounts={() => { fetchLinkedAccounts() }} />
				</flex.centerXY>
			</>
		)
	}
	else {
		return (
			<>
				<flex.centerXY>
					<h2>Accounts</h2>
					<AddNewAccountDropdown refetchLinkedAccounts={() => { fetchLinkedAccounts() }} />
				</flex.centerXY>
				{linkedAccounts.map(((account, index) =>
					<Account linkedAccount={account} key={index} removeLink={() => { removeLink(account) }} />
				))}
			</>
		)
	}
}

export const useFetchLinkedAccounts = (
	setIsLoading: (x: boolean) => void = emptyFunction,
): () => Promise<void> => {
	const dispatch = useAppDispatch()
	return useCallback(async () => {
		setIsLoading(true)
		const response = await makeAuthorizedRequest({
			url: LINKED_ACCOUNTS_URL,
			method: 'GET',
		})
		if (response.ok) {
			try {
				const accounts: TLinkedAccount[] = await response.json()
				dispatch(setLinkedAccounts(accounts))
			}
			catch (e) {
				console.log({ e })
			}
		}
		setIsLoading(false)
	}, [dispatch, setIsLoading])
}

export default Accounts
