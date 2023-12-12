/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { mockedBills } from "../__mocks__/store.js"
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
    })

    test("Then uploading anything but jpg or png it should raise an alert", () => {
      const mockAlert = jest.fn()
      alert = mockAlert
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.zip", {type: 'text/plain'})

      userEvent.upload(inputFile, testFile)

      expect(mockAlert).toHaveBeenCalledTimes(1)
    })
  })
})
