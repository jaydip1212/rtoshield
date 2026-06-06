import "server-only"
import { getServiceDb } from "./db"
import { getEmbeddingProvider } from "./providers"

/** Naive token-aware chunker (~800 chars w/ overlap). Replace with a smarter splitter as needed. */
export function chunkText(text: string, size = 800, overlap = 100): string[] {
	const chunks: string[] = []
	let i = 0
	while (i < text.length) {
		chunks.push(text.slice(i, i + size))
		i += size - overlap
	}
	return chunks
}

/** Embed + store chunks for a document, scoped by org. */
export async function indexDocument(orgId: string, documentId: string, text: string) {
	const db = getServiceDb()
	const chunks = chunkText(text)
	const vectors = await getEmbeddingProvider().embed(chunks)
	for (let idx = 0; idx < chunks.length; idx++) {
		const [chunk] = await db.raw`
			insert into document_chunks (org_id, document_id, idx, content)
			values (${orgId}, ${documentId}, ${idx}, ${chunks[idx]}) returning id`
		const vecLiteral = `[${vectors[idx].join(",")}]`
		await db.raw`insert into embeddings (org_id, chunk_id, embedding) values (${orgId}, ${chunk.id}, ${vecLiteral}::vector)`
	}
	return chunks.length
}

/** pgvector cosine similarity search, ALWAYS scoped by org_id (tenant isolation). */
export async function searchSimilarChunks(orgId: string, query: string, k = 5) {
	const [vec] = await getEmbeddingProvider().embed([query])
	const vecLiteral = `[${vec.join(",")}]`
	const rows = await getServiceDb().raw`
		select c.content, 1 - (e.embedding <=> ${vecLiteral}::vector) as similarity
		from embeddings e join document_chunks c on c.id = e.chunk_id
		where e.org_id = ${orgId}
		order by e.embedding <=> ${vecLiteral}::vector
		limit ${k}`
	return rows as unknown as Array<{ content: string; similarity: number }>
}
