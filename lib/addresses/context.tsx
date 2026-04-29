"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShippingAddress {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  isPrimary: boolean;
}

export interface SavedFflDealer {
  id: string;
  dealerName: string;
  licenseNumber: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  contactName?: string;
  isPreferred: boolean;
}

interface AddressesState {
  shipping: ShippingAddress[];
  fflDealers: SavedFflDealer[];
}

type Action =
  | { type: "ADD_SHIPPING";    address: ShippingAddress }
  | { type: "UPDATE_SHIPPING"; address: ShippingAddress }
  | { type: "REMOVE_SHIPPING"; id: string }
  | { type: "SET_PRIMARY";     id: string }
  | { type: "ADD_FFL";         dealer: SavedFflDealer }
  | { type: "UPDATE_FFL";      dealer: SavedFflDealer }
  | { type: "REMOVE_FFL";      id: string }
  | { type: "SET_PREFERRED";   id: string };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AddressesState, action: Action): AddressesState {
  switch (action.type) {
    case "ADD_SHIPPING":
      return {
        ...state,
        shipping: action.address.isPrimary
          ? [...state.shipping.map((a) => ({ ...a, isPrimary: false })), action.address]
          : [...state.shipping, action.address],
      };
    case "UPDATE_SHIPPING":
      return {
        ...state,
        shipping: state.shipping.map((a) => {
          if (a.id !== action.address.id) {
            return action.address.isPrimary ? { ...a, isPrimary: false } : a;
          }
          return action.address;
        }),
      };
    case "REMOVE_SHIPPING":
      return { ...state, shipping: state.shipping.filter((a) => a.id !== action.id) };
    case "SET_PRIMARY":
      return {
        ...state,
        shipping: state.shipping.map((a) => ({ ...a, isPrimary: a.id === action.id })),
      };
    case "ADD_FFL":
      return {
        ...state,
        fflDealers: action.dealer.isPreferred
          ? [...state.fflDealers.map((d) => ({ ...d, isPreferred: false })), action.dealer]
          : [...state.fflDealers, action.dealer],
      };
    case "UPDATE_FFL":
      return {
        ...state,
        fflDealers: state.fflDealers.map((d) => {
          if (d.id !== action.dealer.id) {
            return action.dealer.isPreferred ? { ...d, isPreferred: false } : d;
          }
          return action.dealer;
        }),
      };
    case "REMOVE_FFL":
      return { ...state, fflDealers: state.fflDealers.filter((d) => d.id !== action.id) };
    case "SET_PREFERRED":
      return {
        ...state,
        fflDealers: state.fflDealers.map((d) => ({ ...d, isPreferred: d.id === action.id })),
      };
    default:
      return state;
  }
}

// ─── Initial mock data ────────────────────────────────────────────────────────

const initialState: AddressesState = {
  shipping: [
    {
      id: "addr-001",
      name: "Garrett R. Jackson",
      line1: "600 2nd Street",
      city: "Jackson",
      state: "MN",
      zip: "56143",
      phone: "(507) 675-4337",
      isPrimary: true,
    },
  ],
  fflDealers: [
    {
      id: "ffl-001",
      dealerName: "Twin Cities Armory",
      licenseNumber: "07-23-XXX-01-7B-12345",
      line1: "1250 Gun Club Rd, Suite A",
      city: "Plymouth",
      state: "MN",
      zip: "55441",
      phone: "(763) 555-0142",
      contactName: "Mike R.",
      isPreferred: true,
    },
  ],
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface AddressesContextValue {
  shipping: ShippingAddress[];
  fflDealers: SavedFflDealer[];
  addShipping: (address: Omit<ShippingAddress, "id">) => void;
  updateShipping: (address: ShippingAddress) => void;
  removeShipping: (id: string) => void;
  setPrimary: (id: string) => void;
  addFfl: (dealer: Omit<SavedFflDealer, "id">) => void;
  updateFfl: (dealer: SavedFflDealer) => void;
  removeFfl: (id: string) => void;
  setPreferred: (id: string) => void;
}

const AddressesContext = createContext<AddressesContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

let nextId = 100;
function genId() {
  return `id-${++nextId}`;
}

export function AddressesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addShipping = useCallback((address: Omit<ShippingAddress, "id">) =>
    dispatch({ type: "ADD_SHIPPING", address: { ...address, id: genId() } }), []);
  const updateShipping = useCallback((address: ShippingAddress) =>
    dispatch({ type: "UPDATE_SHIPPING", address }), []);
  const removeShipping = useCallback((id: string) =>
    dispatch({ type: "REMOVE_SHIPPING", id }), []);
  const setPrimary = useCallback((id: string) =>
    dispatch({ type: "SET_PRIMARY", id }), []);

  const addFfl = useCallback((dealer: Omit<SavedFflDealer, "id">) =>
    dispatch({ type: "ADD_FFL", dealer: { ...dealer, id: genId() } }), []);
  const updateFfl = useCallback((dealer: SavedFflDealer) =>
    dispatch({ type: "UPDATE_FFL", dealer }), []);
  const removeFfl = useCallback((id: string) =>
    dispatch({ type: "REMOVE_FFL", id }), []);
  const setPreferred = useCallback((id: string) =>
    dispatch({ type: "SET_PREFERRED", id }), []);

  return (
    <AddressesContext.Provider value={{
      shipping: state.shipping,
      fflDealers: state.fflDealers,
      addShipping, updateShipping, removeShipping, setPrimary,
      addFfl, updateFfl, removeFfl, setPreferred,
    }}>
      {children}
    </AddressesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAddresses(): AddressesContextValue {
  const ctx = useContext(AddressesContext);
  if (!ctx) throw new Error("useAddresses must be used inside <AddressesProvider>");
  return ctx;
}
