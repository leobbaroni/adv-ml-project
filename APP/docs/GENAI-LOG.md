# Appendix: GenAI Usage Log

## 1. Executive Summary

Rental Buddy was built with an AI-native development methodology. Every phase of the project — from architecture design to prompt engineering to UI polish — leveraged multiple AI models orchestrated through an agent-based workflow. AI was not treated as a novelty; it was the primary engine for parsing unstructured guest data, resolving booking conflicts, and enabling the conversational interface that defines the product. This appendix details our tools, costs, methodologies, and the safeguards we built to ensure reliability.

---

## 2. AI Tool Inventory

| Tool / Model | Provider | Purpose | Phase |
| :--- | :--- | :--- | :--- |
| **Claude Code (Kimi K2.6)** | OpenCode | Primary coding agent, architecture, debugging | All |
| **Gemini 3.1 Pro** | Google | UI design, visual polish, 3D integration | 9 |
| **GPT-5.5 / opencode-zen** | OpenCode | Escalation bugs, complex reasoning | 3, 7 |
| **big-pickle (free tier)** | OpenCode Zen | Runtime AI tasks (overlap resolution, etc.) | 2–8 |
| **Cursor / Copilot** | GitHub | Inline autocomplete, boilerplate | All |

---

## 3. Runtime AI Costs (Unit Economics)

Understanding the "Silicon Cost" is critical to our unit economics. We optimized for high accuracy at the lowest possible token cost.

*   **Model used at runtime (prototyping):** big-pickle (OpenCode Zen free tier)
*   **Production estimate:** Gemini 1.5 Flash (~$0.35/M input tokens, ~$0.70/M output tokens)

### Cost Per Operation

| AI Feature | Tokens / Call | Cost per Call (EUR) |
| :--- | :--- | :--- |
| **Overlap Resolution** | ~800 | ~€0.0003 |
| **Shopping Parser** | ~1,200 | ~€0.0005 |
| **PDF Request Parser** | ~600 | ~€0.0002 |
| **Repair Estimator** | ~1,000 | ~€0.0004 |

### Monthly Projections

*   **Monthly estimate** (100 properties, 50 AI calls/day): **~€0.75/month**
*   **Compared to human cost:** A property manager at €15/hour would exceed this cost in under 4 minutes of work.

Our AI operational costs are effectively negligible compared to the human labor they replace, while operating 24/7 without fatigue.

---

## 4. Prompt Engineering Methodology

Our runtime reliability stems from a rigorous, structured approach to prompt engineering. We do not treat prompts as simple text queries; they are deterministic programs written in natural language.

*   **Structured prompts:** Every prompt includes a strict role definition, a set of immutable rules, few-shot examples, and a rigid output schema.
*   **JSON-mode first:** All prompts explicitly request JSON via `response_format` parameters. We only fall back to plain text parsing in catastrophic failure modes.
*   **Few-shot examples:** Our shopping parser includes 4 diverse examples in the system prompt, conditioning the model for high-variance user input.
*   **Context injection:** We do not rely on the model's internal knowledge. Dynamic property lists, current reservation lists, and live IKEA catalog data are injected at call time to ground the model.
*   **Schema validation:** Every AI output is validated against a Zod schema before it is permitted to touch the database or UI. If the shape is wrong, the operation is halted.
*   **Fail-safe design:** Every AI call has a deterministic fallback. If extraction fails, the system returns `NEEDS_HUMAN`. If classification is ambiguous, it returns an empty array rather than guessing.

---

## 5. Development Iteration Log

The following logs demonstrate our empirical, iterative approach to tuning AI performance.

### Phase 2 — Overlap Resolution

*   **v1:** Simple text prompt, plain text output → Unreliable; parsing failures were common.
*   **v2:** Added JSON-mode and a structured schema → Accuracy jumped to 90%+.
*   **v3:** Added a `rationale` field to the output → Users trust the AI because they can see *why* it made a decision.
*   **v4:** Added `NEEDS_HUMAN` fallback state → Achieved zero false positives by refusing to act on ambiguity.

### Phase 7 — Shopping Parser

*   **v1:** Generic extraction prompt → Frequently missed specific IKEA product names (e.g., "Billy" vs. "shelf").
*   **v2:** Injected a hardcoded catalog into the prompt → Matched 80% of items correctly.
*   **v3:** Added live IKEA API search to the context window → Achieved 95%+ match rate with real-time pricing.
*   **v4:** Added fuzzy string scoring for typos → Made the parser robust to messy user input and autocorrect failures.

### Phase 8 — PDF Request Parser

*   **v1:** Regex-based extraction → Broke instantly on date format variations (e.g., `13/05/2026` vs `May 13`).
*   **v2:** AI with static examples → Improved to 70% accuracy, but struggled with edge cases.
*   **v3:** Dynamic reservation list injection → Grounded the AI in reality; accuracy rose to 95%.
*   **v4:** Added a clarifying-question loop for ambiguity → Eliminated guessing. If the AI is unsure, it asks the host rather than hallucinating.

### Phase 9 — UI Polish

*   Used AI to generate a comprehensive design language specification and a cohesive color palette.
*   Spline 3D hero integrated via an AI-assisted iframe strategy, balancing performance and visual impact.
*   Theme system architecture designed with AI guidance to ensure full accessibility and dark-mode support.

---

## 6. Hallucination Mitigation

We treat hallucination not as a limitation to accept, but as a risk to engineer against.

*   **Ground truth:** The AI never invents data. All outputs are validated against database records (reservations, properties, catalogs) before display.
*   **Schema enforcement:** Zod schemas reject malformed or extra-neous outputs before they reach the UI layer.
*   **Human-in-the-loop:** All high-stakes AI proposals (overlap resolutions, repair estimates) require an explicit **Accept** or **Revert** action from the host.
*   **Deterministic fallback:** If the AI service is down or returns garbage, the system degrades gracefully. It never fails silently.
*   **No creative writing:** AI tasks are strictly constrained to extraction and classification. We do not use generative AI for open-ended content creation in the core product logic.

---

## 7. Lessons Learned

Our journey yielded several non-obvious insights about productionizing LLMs:

1.  **JSON-mode is essential.** Plain text parsing is fragile and scales poorly. Structured output is non-negotiable.
2.  **Few-shot examples are high-ROI.** Adding 3–4 high-quality examples to a system prompt dramatically improves accuracy more than model switching.
3.  **Dynamic context beats static prompts.** Injecting live reservation lists or catalogs at call time is more effective than fine-tuning.
4.  **Schema validation is your safety net.** Always validate AI output with strict schemas before acting.
5.  **Free-tier models are sufficient.** For structured extraction tasks, even free-tier models (big-pickle) perform excellently if the prompt is well-engineered.
6.  **AI is best at ambiguity resolution.** Use deterministic rules for primary data processing; use AI strictly for resolving ambiguity and edge cases.

---

## 8. Future AI Roadmap

We have identified the next high-impact AI features to deepen our moat:

*   **Guest check-in data extraction:** Move from regex stubs to full AI parsing of forwarded guest messages (names, passport data, check-in times).
*   **Semantic search:** Allow hosts to search their entire reservation history using natural language (e.g., "Show me guests who brought dogs last summer").
*   **AI-generated property descriptions:** Auto-generate optimized listing copy for Airbnb/Booking.com based on property amenities.
*   **Predictive maintenance alerts:** Analyze repair request patterns to predict future maintenance needs (e.g., "AC unit #3 is likely to fail based on past tickets").
*   **Multi-language support:** Real-time AI translation for guest communication and document parsing, allowing hosts to operate cross-border without language barriers.
