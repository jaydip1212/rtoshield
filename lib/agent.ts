import "server-only"
import { getLlmProvider } from "./providers"
import { searchSimilarChunks } from "./rag"
import { getBrandProfile } from "./queries"
import { runDeterministicChecks } from "./geo-checker"
import type { RiskDecision } from "./risk-engine"

/**
 * Autonomous RTOShield agent.
 * It uses deterministic checks first, merchant uploaded knowledge second, and
 * LLM reasoning only as an explanation / investigation layer.
 */
const BASE_SYSTEM_PROMPT = `You are RTOShield's autonomous fake-order and RTO investigation agent.

NON-NEGOTIABLE RULES:
1. Never auto-cancel an order. Recommend only; humans approve holds/cancellations.
2. Treat deterministic checks as evidence, not guesses.
3. Use only: order fields, hashed history, pincode intelligence, merchant uploaded docs, webhook/device signals, and retrieved RAG chunks.
4. If evidence is missing, say "unknown". Do not invent.
5. Separate output into: Known facts, Cross-check result, Contradictions, Risk clues, Recommended manual action, Verification script.
6. Prefer privacy-safe reasoning: no raw PII, no GPS without permission, no fingerprinting claims.
7. Every recommendation must include why it is true/false/uncertain.`

export interface AgentReviewInput {
	orgId: string
	orderId?: string
	order: Record<string, unknown>
	decision: RiskDecision
	similarRtoCases: Array<Record<string, unknown>>
}

export interface AgentReviewOutput {
	explanation: string
	recommended_action: string
	whatsapp_script: string
	evidence: { knownData: Record<string, unknown>; reasons: RiskDecision["reasons"]; checks: unknown[] }
}

export async function buildAutonomousSystemPrompt(orgId: string) {
	const profile = await getBrandProfile(orgId)
	return [
		BASE_SYSTEM_PROMPT,
		"\nMERCHANT CUSTOM SYSTEM INSTRUCTIONS:",
		profile.system_instructions || "No merchant override uploaded.",
		"\nBRAND CONTEXT:",
		profile.brand_context || "No brand context uploaded.",
		"\nVERIFICATION POLICY:",
		profile.verification_policy || "Use WhatsApp for medium COD risk; call or prepaid deposit for high COD risk; manual review for critical.",
	].join("\n")
}

export async function runAgentReview(input: AgentReviewInput): Promise<AgentReviewOutput> {
	const [policyChunks, systemPrompt, checks] = await Promise.all([
		searchSimilarChunks(input.orgId, `fake order RTO pincode courier policy ${JSON.stringify(input.order)}`, 6).catch(() => []),
		buildAutonomousSystemPrompt(input.orgId),
		input.orderId ? runDeterministicChecks(input.orgId, input.orderId).catch(() => []) : Promise.resolve([]),
	])

	const userPrompt = [
		"## Order known data", JSON.stringify(input.order, null, 2),
		"## Deterministic risk decision", JSON.stringify(input.decision, null, 2),
		"## Non-AI cross-checks", JSON.stringify(checks, null, 2),
		"## Similar historical RTO cases", JSON.stringify(input.similarRtoCases, null, 2),
		"## Uploaded merchant knowledge excerpts", policyChunks.map((c) => `- ${c.content}`).join("\n") || "none",
		"\nReturn concise investigation notes and a customer-friendly verification script."
	].join("\n\n")

	const explanation = await getLlmProvider().complete(systemPrompt, userPrompt)
	const whatsapp_script = `Hi, this is the store verification team. We are confirming your recent COD order before dispatch. Please reply YES with your delivery availability, or PREPAID if you prefer to convert to prepaid. Thank you.`
	return { explanation, recommended_action: input.decision.recommended_action, whatsapp_script, evidence: { knownData: input.order, reasons: input.decision.reasons, checks } }
}
