import chance from "chance"
const Chance = new chance()

describe('new user is redirected to terms of service page', () => {
    beforeEach('make request for authorization token', () => {
        cy.request('POST', 'localhost:8080/create_test_user/', {
            email: `${Chance.string()}@generaltask.com`,
            name: 'Test User',
        }).then((response) => {
            cy.setCookie('authToken', `${response.body.token}`)
        })
    })
    beforeEach('visit generaltask', () => {
        cy.visit('/')
    })
    it('user redirects to terms of service page', () => {
        cy.location('pathname', { timeout: 60000 }).should('include', '/tos-summary')
    })
})
