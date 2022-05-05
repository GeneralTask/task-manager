import chance from "chance"

const Chance = new chance()
const API_URL = Cypress.env('api_url')

Cypress.Commands.add('login', () => {
    cy.request('POST', `${API_URL}/create_test_user/`, {
        email: `${Chance.string()}@generaltask.com`,
        name: 'Test User',
    }).then((response) => {
        cy.setCookie('authToken', `${response.body.token}`)
    })
})

Cypress.Commands.add('acceptTermsOfService', () => {
    cy.findByTestId('terms-check-button').click()
    cy.findByTestId('terms-submit-button').click()
})
