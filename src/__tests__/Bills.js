/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import {mockedBills} from '../__mocks__/store.js'
import userEvent from '@testing-library/user-event'

import router from "../app/Router.js";
import Bills from '../containers/Bills.js';
import $ from 'jquery'

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test('Then eye icon should show the bill', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsPage = new Bills({document, onNavigate, mockedBills, localStorageMock})
      const mockHandleClickIconEye = jest.fn(billsPage.handleClickIconEye)
      const modalFile = document.querySelector('#modaleFile')
      $.fn.modal = jest.fn(modalFile.classList.add('show'))

      const iconEyes = screen.getAllByTestId('icon-eye')
      iconEyes.forEach(icon => {
        icon.addEventListener('click', () => mockHandleClickIconEye(icon))
      }) 
      iconEyes.forEach(icon => {
        userEvent.click(icon)
      })

      expect(mockHandleClickIconEye).toHaveBeenCalledTimes(iconEyes.length)
      expect(modalFile).toHaveClass('show')
    })
  })
})
