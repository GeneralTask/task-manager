describe('user can mark as task as done', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('user can mark task as done', () => {
        // Intercept mark task as done requests
        cy.intercept('PATCH', '/tasks/modify/*').as('markTaskDoneMutation')

        cy.findAllByTestId('list-item').first().within(() => {
            cy.get('button').find('img').should('have.attr', 'src', '/images/task_incomplete.png').click()
            cy.get('button').find('img').should('have.attr', 'src', '/images/task_complete.png')
        })
        cy.wait('@markTaskDoneMutation').then(({ response }) => {
            expect(response?.statusCode).to.eq(200)
        })
    })
    it('task appears in done section', () => {
        cy.visit('/tasks/000000000000000000000004/')
        cy.findAllByTestId('list-item').should('have.length', 1)
    })
})
