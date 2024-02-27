# Documentation for Governor canister

## Public actor functions

### `propose(content : Types.ProposalContent, payload : Types.ProposalPayload) : async Result.Result<Types.Proposal, Text>`

Allows a principal to propose a new governance proposal. Principal should own a certain percentage (`proposalThreshold`) of vote tokens to be eligible to propose.

#### Parameters:

- `content`: The content of the proposal
  - `type ProposalContent = { title : Text; description : ?Text };`
- `payload`: Executable payload of the proposal
  - `type ProposalPayload = { canisterId : Principal; method : Text; data : Blob };`

#### Returns:

A `Result` containing either the proposed governance `Proposal` or an error message in case of failure.

---

### `castVote(proposalId : Nat, voteOption : Types.VoteOption) : async Result.Result<Types.Proposal, Text>`

Allows a principal to cast their vote on a specific governance proposal.

#### Parameters:

- `proposalId`: The ID of the proposal.
- `voteOption`: The voting option chosen by the voter.
  - `type VoteOption = { #for; #against; };`

#### Returns:

A `Result` containing either the updated `Proposal` after voting or an error message if unsuccessful.

---

### `execute(proposalId : Nat) : async Result.Result<Types.Proposal, Text>`

Executes an approved proposal. If governor doesn't have any timelock delay, then the proposal will be executed immediately. Otherwise, it will be put into the queue and executed automatically on the next system heartbeat after timelock ends.

#### Parameters:

- `proposalId`: The ID of the proposal to be executed.

#### Returns:

A `Result` containing either the executed `Proposal` or an error message if execution fails.

---

### `cancel(proposalId: Nat) : async Result.Result<Types.Proposal, Text>`

Allows for cancellation of an open or queued governance proposal by its proposer or governor guardian.

#### Parameters:

- `proposalId`: Identifies which specific governance Proposal will be canceled

#### Returns:

A `Result` containing either the updated `Proposal` after cancellation or an error message if unsuccessful.

---

### `updateSystemParams(payload : Types.UpdateGovernorSystemParamsPayload) : async ()`

Updates the system parameters of the Governor.

#### Parameters:

- `payload`: The payload containing system parameters that need to be updated.

---

### `getProposal(proposalId : Nat) : async Result.Result<Types.Proposal, Text>`

Retrieves a specific governance proposal by its ID.

#### Parameters:

- `proposalId`: The ID of the proposal to retrieve.

#### Returns:

A `Result` containing either the requested `Proposal` or an error message if not found.

---

### `getProposals() : async [Types.Proposal]`

Retrieves all existing governance proposals with their derived status based on system parameters.

#### Returns:

An array of `Proposal`s along with their respective statuses.

---

### `getSystemParams() : async Types.GovernorSystemParams`

Retrieves the current system parameters of the Governor.

#### Returns:

The current governor's system parameters.

---

### `getPastTotalSupply(timepoint : Time.Time) : async Nat`

Fetches the total supply of vote tokens at a specific time point in the past.

#### Parameters:

- `timepoint`: The specific time point for which to retrieve the total supply.

#### Returns:

The total supply of vote tokens at the specified time.

---

### `getPastVotes(account : Principal, timepoint : Time.Time) : async Nat`

Retrieves the number of vote tokens held by an account at a specific time point in the past.

#### Parameters:

- `account`: The principal account for which to retrieve vote count.
- `timepoint`: The specific time point for which to fetch vote count.

#### Returns:

The number of vote tokens held by the specified account at the given time.

---

## Types

Types can be seen [here](https://github.com/redsteep/dfinity-icp-governor/blob/main/packages/canisters/src/types.mo).
