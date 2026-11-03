# Homework - QA Automation Engineer

## Overview

This exercise is split into **two independent parts**. Total expected time: **4-6 hours across both parts**.

AI tools are permitted. We will ask you to explain your approach and your choices in the follow-up interview - the goal is to understand how you think, not what you can generate.

Feel free to make opinionated choices.

---

## Part 1 - API Testing *(2-4h)*

### Context

You are joining a platform team. You are tasked with designing a focused API test suite for the **Job Offer Microservice**. You are provided with the OpenAPI specification (`job-offer-swagger.yml`) as your only input.

==> `job-offer-swagger.yml` : *(attach file)*

### Deliverables

| # | Deliverable | Format |
| --- | --- | --- |
| 1 | **Test Scenarios** | Markdown table(s) or equivalent |
| 2 | **Coverage Rationale** | Short paragraph |
| 3 | **Runnable Collection** | Postman, Bruno, Playwright, or any runnable format |

### Test Scenarios

Design **20 to 50 test scenarios** covering the areas you consider most critical.

You are **not** expected to cover everything - we are evaluating your ability to prioritize and reason about risk.

| Column | Description |
| --- | --- |
| ID | Unique identifier (e.g., `CRUD-001`) |
| Scenario | Clear description of what is being tested |
| Preconditions | Required state or data before the test |
| Request | Method, endpoint, key payload / parameters |
| Expected Status | HTTP status code |
| Expected Result | Key assertions on response body / headers |
| Priority | P1 (critical) / P2 (important) / P3 (nice-to-have) |

### Coverage Rationale

In a short paragraph, explain:

- What areas you chose to focus on and **why**
- What you deliberately left out and **why**
- Any assumptions you made about the system

### What to Skip

- Authentication / authorization (assume requests include a trusted `X-Company-Id` header)
- CI/CD pipelines
- Exhaustive coverage - quality and reasoning over quantity

---

## Part 2 - E2E Testing *(2-4h)*

### Context

You are provided with an existing React application to test against:

- **Repository:** <https://github.com/TonyMckes/conduit-realworld-example-app>
- **Live demo:** <https://conduit-realworld-example-app.fly.dev/>

The application is a blogging platform with user authentication, article management, comments, and a social follow system.

### Setup - your choice

| Option | How |
| --- | --- |
| **Live demo** | Run tests directly against the hosted app - no local setup needed |
| **Local** | Clone the repository and follow the README setup instructions to launch the docker image |

> If using the live demo: the environment is shared. Your tests must be self-contained - create the data they need and scope assertions to data they own.

### Deliverables

| # | Deliverable | Format |
| --- | --- | --- |
| 1 | **Test Scenarios** | Markdown table(s) or equivalent |
| 2 | **Coverage Rationale** | Short paragraph |
| 3 | **Runnable Tests** | Tests that are running in the chosen environment (Local or Live Demo) |
| 4 | **README.md** | A readme file to explain how to run the tests |

Implement **2-3 user flows of your choice** using the E2E framework of your choice - Playwright, Cypress, WebdriverIO, or other.

### What We Look For

We value:

- Clear separation between selectors, actions, and test logic
- Test files readable without knowing the framework internals
- A structure a team could extend without guidance from you

We do **not** require:

- Full coverage of the application
- CI/CD integration
- Visual or accessibility testing

---

## Technical Reference *(Part 1)*

### State Machine

```
                    +--------------+
                    |    DRAFT     |
                    +------+-------+
                           | submit()
                           v
              +------------------------+
              |  TO_FINALIZE (optional)| <-- partialSaveEnabled=true
              +------------+-----------+
                           | finalize()
                           v
              +------------------------+
              |  TO_APPROVE (optional) | <-- approvalRequired=true
              +------------+-----------+
                           | approve() / reject()
                           v
              +------------------------+
              |   TO_POST (optional)   | <-- manualPostingRequired=true
              +------------+-----------+
                           | post()
                           v
                    +--------------+
                    |   PUBLISHED  |
                    +------+-------+
                           | close()
                           v
                    +--------------+
                    |    CLOSED    |
                    +--------------+
```

### Key Behaviors

| Behavior | Description |
| --- | --- |
| Optional states | Skipped when the corresponding flag is `false` |
| `withdraw()` | Returns any active state back to `DRAFT` |
| `reopen()` | Moves `CLOSED` back to `PUBLISHED` |
| Edit restrictions | Only allowed in `DRAFT` or `TO_FINALIZE` |
| Delete restrictions | Only allowed in `DRAFT` |
| `reject()` | Requires a `reason` field |

### Company Configuration Flags

| Flag | When `true` |
| --- | --- |
| `approvalRequired` | Offers must be approved before posting |
| `partialSaveEnabled` | Incomplete offers allowed; uses `TO_FINALIZE` state |
| `manualPostingRequired` | Approved offers wait in `TO_POST` for manual action |

### Multi-Tenancy Rules

- All requests require an `X-Company-Id` header (UUID format)
- Companies see only their own job offers
- Cross-company access returns `404` (not `403` - no information leakage)
- Missing header returns `401`
- Invalid UUID format returns `400`

### Completeness Rules

A job offer is **complete** when it has:

- `title` (required, 1-200 characters)
- `location` (required; if `type=CUSTOM`, address with `city` and `countryCode` required)
- At least one entry in `compensation.salaryEntries`

---

## Discussion Points

Be prepared to discuss in the follow-up interview:

1. What did you choose to focus on in Part 1, and why?
2. What did you deliberately leave out, and why?
3. Walk us through a test or a piece of code you are particularly proud of.
4. How would this evolve if we added a new requirement or a new state to the machine?
5. How did you use AI tools during this exercise, if at all?
