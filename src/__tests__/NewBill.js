/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES } from '../constants/routes.js'
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockedBills from "../__mocks__/store.js"
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))
      const html = NewBillUI()
      document.body.innerHTML = html
    })

    test("Then uploading anything but jpg or png it should raise an alert", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
      newBill.store = mockedBills
      const mockAlert = jest.fn()
      alert = mockAlert
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.zip", {type: 'text/plain'})

      userEvent.upload(inputFile, testFile)

      expect(mockAlert).toHaveBeenCalledTimes(1)
    })

    test("Then uploading a jpg or png it should create a file in the store", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
      newBill.store = mockedBills
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.jpg", {type: 'image/jpg'})
      jest.spyOn(mockedBills.bills(), 'create')

      userEvent.upload(inputFile, testFile)

      expect(mockedBills.bills().create).toHaveBeenCalledTimes(1)
    })

    test("Then we should handle the submit button", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
      const mockHandleSubmit = jest.fn()
      const formNewBill = document.querySelector(`form[data-testid="form-new-bill"]`)
      formNewBill.addEventListener("submit", mockHandleSubmit)
      const btnSubmit = document.querySelector('#btn-send-bill')

      userEvent.click(btnSubmit)

      expect(mockHandleSubmit).toHaveBeenCalled()
    })
    test("Then we can submit a bill", async () => {
      const mockOnNavigate = jest.fn()
      const newBill = new NewBill({document, onNavigate: mockOnNavigate, store: mockedBills, localStorageMock})
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.jpg", {type: 'image/jpg'})
      jest.spyOn(newBill, 'updateBill')

      // we need to parse getItem once more because it JSON.stringify the result
      const mockLocalStorageGetItem = jest.fn(localStorageMock.getItem)
      localStorageMock.getItem = key => JSON.parse(mockLocalStorageGetItem(key))

      await userEvent.upload(inputFile, testFile)
      await userEvent.selectOptions(screen.getByTestId('expense-type'), ['Services en ligne'])
      await userEvent.type(screen.getByTestId('expense-name'), 'test')
      await userEvent.type(screen.getByTestId('amount'), '250')
      // datepicker dateformat is US style
      await userEvent.type(screen.getByTestId('datepicker'), '2023-12-12')
      await userEvent.type(screen.getByTestId('vat'), '25')
      await userEvent.type(screen.getByTestId('pct'), '10')
      await userEvent.type(screen.getByTestId('commentary'), 'a test commentary for the bill')
      await userEvent.click(document.querySelector('#btn-send-bill'))

      // call onNavigate 2 times because once in NewBill.handleSubmit 
      // and once in updateBill who is called in handleSubmit
      expect(mockOnNavigate).toHaveBeenCalledTimes(2)
      expect(newBill.updateBill).toHaveBeenCalledWith({
        "amount": 250, 
        "commentary": "a test commentary for the bill", 
        "date": "2023-12-12",
        "email": "a@a",
        "fileName": "test.jpg", 
        "fileUrl": "https://localhost:3456/images/test.jpg", 
        "name": "test", 
        "pct": 10, 
        "status": "pending", 
        "type": "Services en ligne", 
        "vat": "25"
      })
    })
    test("Then it should raise an 404 error", async () => {
      expect.assertions(1);
      jest.spyOn(mockedBills, "bills")
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          create : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
      }})

      const mockOnNavigate = jest.fn()
      const newBill = new NewBill({document, onNavigate: mockOnNavigate, store: mockedBills, localStorageMock})

      expect(newBill.store.bills().create()).rejects.toEqual(new Error('Erreur 404'))
    })
    test("Then it should raise an 500 error", async () => {
      expect.assertions(1);
      jest.spyOn(mockedBills, "bills")
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          create : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
      }})

      const mockOnNavigate = jest.fn()
      const newBill = new NewBill({document, onNavigate: mockOnNavigate, store: mockedBills, localStorageMock})

      expect(newBill.store.bills().create()).rejects.toEqual(new Error('Erreur 500'))
    })
  })
})
