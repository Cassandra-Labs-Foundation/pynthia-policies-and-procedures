// What is still fixture data, and why.
//
// The members, accounts and transactions that used to live here are gone —
// they come from the banking core now, through lib/api.js. What remains is the
// teller's cash drawer, and it remains because the core genuinely has no
// drawer to read.
//
// That is not an oversight to fix in the UI. Cash custody is CP-05, one of the
// controls the platform deliberately leaves red: a drawer belongs to a named
// teller, and the fact of who holds which drawer lives in an employee roster
// this system does not have. The API has POST /cash-ops/custody for attesting
// to custody once a roster exists, but nothing that answers "what is in
// drawer 3 right now."
//
// So this is a placeholder standing in for an organisational input, not for
// unwritten code. See HANDOFF.md, Group A.

export const initialTellerDrawer = {
  isOpen: true,
  balance: 5000.00,
  lastBalanced: '2025-05-14T09:00:00Z',
  cashBreakdown: {
    pennies: 500,
    nickels: 200,
    dimes: 300,
    quarters: 500,
    ones: 1000,
    fives: 1000,
    tens: 1000,
    twenties: 2000,
    fifties: 0,
    hundreds: 0
  }
};
