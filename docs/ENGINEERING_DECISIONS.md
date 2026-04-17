# Engineering Decisions and Tradeoffs

This document captures the key technical decisions made in ServiceEats, the alternatives considered, and the tradeoffs accepted.

Purpose:
- Show intentional engineering decisions for internship and interview review
- Record why current architecture exists
- Make future changes easier to reason about

## How to Read This

Each record includes:
- Context: Problem or requirement
- Decision: What was chosen
- Alternatives: Other options considered
- Tradeoffs: What we gained and what we gave up
- Why this was acceptable: Why this tradeoff made sense for this project stage

---

## Decision 001: Kafka KRaft Cluster (No ZooKeeper)

Context:
- ServiceEats relies on event-driven communication between services (orders, notifications, etc.)
- Order, payment, delivery, and notification flows are chained through Kafka topics, so broker downtime directly impacts core business flows.
- The previous single-broker direction was a clear single point of failure for asynchronous processing.
- Needed a setup that avoids coordination bottlenecks and reduces operational overhead.

Decision:
- Use a 3-broker Kafka cluster in KRaft mode via Docker Compose.
- Configure service clients with broker lists (`KAFKA_BROKERS`) instead of a single broker address.
- Set replication and ISR policies to protect internal topics and improve durability.

Alternatives considered:
- Single Kafka broker (simpler but not fault-tolerant)
- Kafka with ZooKeeper (traditional setup but adds operational complexity)
- Managed cloud Kafka (strong operational model but outside this project's local-first scope)

Tradeoffs:
- Pros:
  - Eliminates ZooKeeper -> fewer moving parts to manage
  - Better fault tolerance than single broker (broker failure does not halt event flow)
  - Aligns with Kafka's future direction (KRaft is replacing ZooKeeper)
  - Better mirrors production messaging topology than local single-node setups
- Cons:
  - Higher local resource usage (3 brokers consume more RAM/CPU during development)
  - Debugging cluster issues is harder (e.g., broker election, replication lag)
  - More complex Docker setup (networking + multiple containers)
  - Startup time is longer compared with a single local broker

Why this was acceptable:
- The added complexity was acceptable because reliability of event processing was more critical than local setup simplicity.
- For internship evaluation, this also demonstrates practical distributed-systems decisions instead of only CRUD microservices.

---

## Decision 002: Modular, Path-Scoped CI Workflows

Context:
- Running all pipelines on every change was slow and noisy.
- Frontend-only changes were triggering backend formatting and compose checks, increasing feedback time without added value.
- CI logs were harder to interpret because unrelated jobs frequently failed alongside the relevant one.

Decision:
- Split CI workflows by scope (frontend, services formatting, Docker compose), each triggered by relevant paths.
- Keep checks in CI in non-mutating mode (`prettier --check`) to preserve deterministic pipeline behavior.
- Use separate workflow files so each concern can evolve independently.

Alternatives considered:
- Single monolithic CI workflow

Tradeoffs:
- Pros:
  - Faster feedback for targeted changes
  - Lower CI cost and reduced queue time
  - Cleaner failure signals
- Cons:
  - More workflow files to maintain
  - Path filters must be kept accurate as the repo structure evolves
  - Slightly higher maintenance overhead when adding new services or directories

Why this was acceptable:
- The extra workflow maintenance was acceptable because faster and clearer feedback improves developer velocity and reduces noisy CI failures.
- For a portfolio project, this also shows deliberate CI design rather than default, all-in-one automation.

---

## Template for New Decisions

Copy this section when adding a new decision:

## Decision XXX: Title

Context:
- 

Decision:
- 

Alternatives considered:
- 

Tradeoffs:
- Pros:
  - 
- Cons:
  - 

Why this was acceptable:
- 
