describe('user can create a new General Task task', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('clicking "enter" in the input field should not create a new task', () => {
        cy.intercept('POST', '/tasks/create/gt_task/', () => {
            throw new Error('Create new task request should not be sent')
        })
        cy.findByPlaceholderText('Add new task').type('{enter}')
        cy.findAllByTestId('list-item').should('have.length', 3)
    })
    context('user can create a new General Task task with title', () => {
        before('add text to "create new task" field', () => {
            cy.findByPlaceholderText('Add new task').type('New task')
        })
        it('clicking "enter" in the input field should create a new task with title "New task"', () => {
            cy.intercept('POST', '/tasks/create/gt_task/').as('createTask')
            cy.findByPlaceholderText('Add new task').type('{enter}')
            cy.wait('@createTask')
            cy.findAllByTestId('list-item').should('have.length', 4)
            cy.findAllByTestId('list-item').first().should('contain', 'New task')
        })
    })
})
