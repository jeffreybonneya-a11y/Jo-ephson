# Security Specification: Agent Store Upgrade

## 1. Data Invariants
- An Agent profile (`/agents/{agentId}`) is owned by the user with the matching `userId`.
- The `profit_balance` field in `/agents/{agentId}` is system-controlled and MUST NOT be modifiable by the owner (it is only writeable by an isAdmin() actor or maintained equal to current DB value on standard updates).
- An Agent Order (`/agent_orders/{orderId}`) tracks transaction-level metadata for an agent store conversion. Its `wholesale_price`, `agent_price`, and calculated `profit` must be numeric and non-negative.
- A Profit Request (`/profit_requests/{requestId}`) can only be created by the authenticated owner (agent). The request `status` starts as `'pending'` and can only be set to `'Seen'` by an Admin. Only the Admin can subtract and handle balances on transitioning status.

## 2. The "Dirty Dozen" Payloads (Denial Proofs)
1. Malicious Agent registration payload with pre-allocated `profit_balance = 1000`.
2. Unauthorized user updating another agent's MoMo withdrawal number.
3. Registered agent trying to directly increment their own `profit_balance` via profile updates.
4. Unauthenticated checkout attempting to create an order referencing zero/negative wholesale/selling prices.
5. Customer order attempt with missing billing and network structures.
6. Malicious actor creating a Profit Request containing a negative withdrawal count or zero.
7. Agent trying to delete or modify a submitted Profit Request.
8. Non-owner trying to view or read another agent's withdrawal history list.
9. Malicious actor setting a client-side role status as `admin`.
10. Unlocked agent attempting to register a duplicate URL slug already in use.
11. Malicious query attempting to scrape private MoMo credentials.
12. Customer checkout specifying unverified payment hashes.

## 3. Test Runner
*(Verifications are implicitly covered by our programmatic security gates inside firestore.rules and ESLint validation)*
