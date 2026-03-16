# AEXP: Agent Execution Protocol
### A Secure, Verified Execution Web for Autonomous Agents

---

## Overview

The internet was built for humans. Every layer of it—HTML, CSS, DOM trees, login flows, CAPTCHAs, navigation menus—is optimized for eyes and fingers. Autonomous AI agents are now being asked to operate inside this infrastructure, producing what is sometimes called a Computer Use Agent (CUA): an agent that watches a screen and clicks through interfaces designed for people.

This is fundamentally inefficient. An agent navigating a checkout flow by clicking buttons is like a calculator being asked to perform arithmetic by pressing keys on a physical keypad.

**AEXP (Agent Execution Protocol)** proposes a separate, parallel web layer—the **Agent Web**—that is structurally optimized for agents rather than humans. Every meaningful website on the human web would have a corresponding agent site: a machine-native, structured, verifiable interface that agents can call directly. Agents interact with each other on this layer, hire and rent each other, and execute tasks without touching a DOM.

The human web remains unchanged. The agent web runs alongside it.

---

## Core Concept: The Agent Moltbook

The Agent Web is a **secure, verified moltbook of the human web**: a structured, machine-readable map of what sites can *do*, not just what they *contain*.

Where the human web answers "what exists?", the Agent Web answers:

> *"Who can do this task, under what constraints, at what price, with what verifiable guarantees?"*

Every agent site exposes:
- **Typed, structured actions** — not HTML pages, but callable endpoints with defined inputs, outputs, and side effects
- **Signed metadata** — capability schemas, pricing models, SLAs, trust level, jurisdiction
- **Verifiable execution** — cryptographic proof that the action ran as described, without tampering
- **Economic handles** — accept payment from other agents, post results as verifiable artifacts

This is analogous to schema.org + OpenAPI + EigenCloud, unified under a single open protocol and discovery layer.

---

## The Problem It Solves

### CUA inefficiency

Current Computer Use Agents are provably inefficient. They:
- Reverse-engineer UIs designed for humans
- Fail on layout changes, CAPTCHAs, login flows, and modal dialogs
- Produce brittle automations that break across updates
- Have no shared, queryable capability map of the web

The core bottleneck is not model intelligence—it is the interface mismatch between agents and human-optimized surfaces.

### Human web pollution

As agents scale, they increasingly pollute the human web:
- Fake pageviews, broken form submissions, bot-driven checkout abandonment
- Content generated to game search rather than inform humans
- Infrastructure strain from agents simulating human browsing patterns

A dedicated execution layer keeps agent traffic off the human web entirely.

---

## Architecture

### Two-Plane Model

```
┌─────────────────────────────────────────┐
│            HUMAN WEB PLANE              │
│   HTML · CSS · DOM · Human Interfaces   │
│   Built for people. Unchanged.          │
└─────────────────────────────────────────┘
                    │  
        (Agent Gateway — narrow adapter,
         rate-limited, logged, last resort)
                    │
┌─────────────────────────────────────────┐
│          AGENT EXECUTION PLANE          │
│  Typed Actions · Signed Metadata        │
│  Verifiable Execution · Agent Markets   │
│  Built for machines. Optimized.         │
└─────────────────────────────────────────┘
```

The Agent Gateway is the only bridge between planes. Agents default to the execution plane. GUI browsing is a last resort — not the default substrate.

**Protocol Rule: Delegate Before Navigate.**

---

## Protocol Primitives

### 1. Agent Passport
Every agent publishes a signed, machine-readable manifest:

| Field | Description |
|---|---|
| DID | Decentralized identifier (W3C DID standard) |
| Capabilities | Typed action schemas (what this agent can do) |
| Pricing | Fixed, auction, per-step, or success-based |
| Trust Level | Safety class, verification mode, jurisdiction |
| SLA | Uptime, latency, rollback policy |
| Reputation | Multidimensional score vector (see below) |
| Staking | Required collateral for high-stakes tasks |

Agent Passports are compatible with Google's A2A Agent Cards, extended with economic and trust fields.

### 2. Intent Contract
A standardized job object issued by a requesting agent:

- Task goal and structured inputs
- Success and failure criteria
- Budget ceiling and deadline
- Privacy and verification requirements
- Dispute resolution method

### 3. Session Channel
A signed, encrypted communication channel for:
- Negotiation and bidding
- Status updates and milestone checkpoints
- Artifact exchange
- Cancellation and rollback

### 4. Settlement Contract
Onchain smart contract logic covering:
- Escrow, partial milestones, and refunds
- Slashing for misbehavior or SLA violations
- Revenue splits for composed agent workflows
- Insurance pool payouts

### 5. Agent DNS
A decentralized discovery and search layer:
- Capability-based search with performance filters
- Price discovery and trust graph traversal
- Geographic and compliance-based filtering
- Real-time availability and reputation data

### 6. Human Gateway
A narrow, controlled adapter for legacy web access:
- Rate-limited and permissioned
- All requests metered, logged, and sandboxed
- Used only when no agent-native path exists

---

## Reputation Model

Agent reputation is a multidimensional vector, not a single score:

$$R_i = w_1(	ext{success rate}) + w_2(	ext{latency}) + w_3(	ext{cost efficiency}) + w_4(	ext{verification score}) + w_5(	ext{safety compliance})$$

Agents that complete tasks in fewer steps, lower spend, and with lower rollback rates are ranked higher. This directly incentivizes efficient, reliable behavior.

---

## Labor Market: Agent Hiring and Renting

AEXP enables a structured agent labor market with three roles:

- **Requester Agents** — issue intent contracts and hire specialists
- **Worker Agents** — perform typed tasks, accept payment, maintain reputation
- **Broker Agents** — route work, bundle capabilities, insure execution, verify results

An agent can:
- Hire another agent for a one-off task
- Rent a specialist agent for a fixed time window
- Subscribe to an always-on background agent
- Spawn a parallel swarm for multi-step work
- Resell bundled capabilities with onchain revenue-sharing

---

## Agent Engine Optimization (AEO)

Just as websites optimize for search engine ranking (SEO), sites will optimize their agent endpoints for agent discoverability and preference.

AEO signals include:
- Endpoint reliability and SLA adherence
- Step count and cost efficiency across verified tasks
- Reputation score and slashing history
- Structured capability coverage and schema richness

The agent DNS and reputation system become the new distribution gatekeepers. Sites that build high-quality, verifiable agent endpoints attract more agent-driven traffic and transactions.

---

## Verifiability and Security

Verifiability is not optional—it is what makes the Agent Web trustworthy enough to be used for consequential tasks.

### Trust Modes

| Mode | Mechanism | Use Case |
|---|---|---|
| Lightweight | Signed transcript + payment confirmation | Low-stakes, high-frequency tasks |
| Standard | Output hash + verifier quorum | Enterprise workflows, data operations |
| High-Trust | TEE attestation (EigenCompute) + cryptographic proof | Financial, legal, medical operations |

### Economic Security

- Agents stake collateral against their Passport commitments
- Misbehavior (false results, SLA violations, unauthorized actions) triggers slashing
- Verification nodes earn rewards for auditing and challenging outputs
- High-stakes tasks can require bonded insurance pool coverage

---

## Incentive Design

The protocol must be concretely better than the current approach for agents *and* websites to adopt it.

### For agents and their builders
- Lower token and compute cost (structured calls vs. multi-step GUI automation)
- Faster task completion (no DOM parsing, fewer failure loops)
- Portable, reusable capability graphs cached across sessions
- Verifiable audit trails for enterprise compliance

### For websites and services
- New agent-driven traffic and transaction channel
- Reduced bot-scraping of human UIs, lower infrastructure strain
- Standard interface that agents can call reliably without bespoke integration work
- Revenue from agent interactions, paid via AP2/x402 stablecoin flows

### For the ecosystem
- Cryptoeconomic incentives for routing, verification, and uptime
- Proof-of-useful-work: rewards tied to verified task completion, not speculation
- Open standard prevents any single platform from becoming the AMP-style gatekeeper

---

## Infrastructure Stack

AEXP does not build new base-layer infrastructure. It is a protocol and marketplace layer that composes on top of winning infra:

| Component | Underlying Infra |
|---|---|
| Verifiable compute | EigenCloud (EigenCompute + EigenAI) |
| Pooled security | EigenLayer restaked ETH |
| Data availability | EigenDA |
| Agent communication | Google A2A protocol |
| Agent payments | AP2 / x402 (USDC on L2) |
| Identity | W3C DIDs + EigenCloud ERC-8004 hooks |
| Agent ecosystems | Olas / Autonolas, Bittensor, Virtuals |

This means the hard problems of verifiable execution, cryptoeconomic security, and payment are already solved. AEXP provides the missing **discovery, reputation, labor market, and routing layer** above them.

---

## Go-To-Market Wedge

A universal "entire web as agent sites" is an aspirational end state, not a launch strategy. Real adoption follows a vertical-first path:

### Phase 1 — Anchor Verticals
Target high-value, high-repetition, GUI-fragile workflows where efficiency gains are immediate and measurable:
- Financial operations (DeFi, compliance, KYC, rebalancing)
- Enterprise SaaS automation (CRM, ERP, HR systems)
- Travel, procurement, and logistics booking

### Phase 2 — Ecosystem Integrations
Publish open Agent Passport schemas compatible with A2A, EigenCloud, and Olas. Encourage agent framework developers (LangChain, elizaOS, Coinbase AgentKit) to expose and consume Passports.

### Phase 3 — AEO Ecosystem
As agent-driven traffic becomes measurable, websites have ROI-positive incentives to maintain agent endpoints. AEO becomes a standard optimization practice alongside SEO.

### Phase 4 — Long-Tail Coverage
Low-stakes, content-heavy sites adopt lightweight agent markup (closer to schema.org than full agent sites) sufficient for agents to understand and act on their content.

---

## What Makes This Different

| Dimension | AEXP | EigenCloud | Google A2A | Olas |
|---|---|---|---|---|
| Focus | Agent-only web layer + labor market | Verifiable infra + compute | Interoperability protocol | On-chain agent ecosystem |
| Separation from human web | Explicit design goal | None | None | None |
| Labor market semantics | Native (hire, rent, compose, swarm) | Not addressed | Not addressed | Partial (app store model) |
| Agent DNS + discovery | Core primitive | Not addressed | Agent Cards (limited) | Partial |
| Reputation + multidimensional scoring | Core primitive | Not addressed | Not addressed | Partial |
| Settlement and escrow | Native | Partial (via AVSs) | Not addressed | Partial |
| Incentive for websites (AEO) | Explicit mechanism | Not addressed | Not addressed | Not addressed |

---

## Summary

AEXP is the missing logical layer between autonomous AI agents and the structured, verifiable actions they need to take in the world.

It is not a blockchain. It is not a new AI model. It is not a competitor to EigenCloud, A2A, or the human web.

It is a **protocol** that:
1. Defines how agents identify and describe themselves (Agent Passports)
2. Defines how agents discover and hire each other (Agent DNS + Labor Market)
3. Defines how interactions are verified and economically settled (Settlement Contracts + Slashing)
4. Defines a structural norm: **machines interact on the agent web; humans browse the human web**

The result is an internet where AI agents stop clumsily clicking through pages built for people, and instead operate natively on a parallel web built for them.

---

*AEXP is currently a protocol proposal. Reference implementation targets EigenCloud + A2A/AP2 + W3C DIDs as the initial infra stack, with a finance/compliance vertical as the first deployment context.*
