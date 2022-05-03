describe('user can create a new General Task task', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('user visits initial task section', () => {
        cy.visit('/tasks')
    })
    it('add text to "create new task" field', () => {
        cy.findByPlaceholderText('Add new task').type('New task')
        cy.findByPlaceholderText('Add new task').should('have.value', 'New task')
    })
    it('clicking "enter" in the input field should create a new task with title "New task"', () => {
        cy.intercept('POST', '/tasks/create/gt_task/').as('createTask')
        cy.findByPlaceholderText('Add new task').type('{enter}')
        cy.wait('@createTask')
        cy.findAllByTestId('list-item').should('have.length', 4)
        cy.findAllByTestId('list-item').first().should('contain', 'New task')
    })
})
