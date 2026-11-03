# 0007 Reports in one place, keyed by scenario ID

Context: a run must leave something a human can open, something CI can ingest, and something that answers "which scenarios of which priority passed", not only "how many tests".

Decision: `config/reporting.ts` gives both parts the same reporter set, written under `reports/<part>/`: `list` for the terminal, `html` to debug (with trace, screenshot and video on failure; the API suite keeps traces too, so a failed call shows its request and response), `results.json` and `junit.xml` for machines. `scripts/scenario-report.ts` joins `results.json` with the scenario table of each part and writes `reports/scenarios.md`: one line per scenario ID with its priority and worst status, totals per priority, and a non-zero exit when a P1 scenario did not pass. It is the last step of `npm run verify`.

Consequences: the deliverable table, the tests and the run results share one key. A CI job publishes `reports/` as its artifact and reads `junit.xml`; the P1 line is the quality gate a pipeline can block on. Allure was not added: it needs a server and a dependency and would show nothing these four outputs do not.
