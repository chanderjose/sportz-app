import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';
import { matchIdParamSchema } from '../validation/matches.js';

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
	const paramsResult = matchIdParamSchema.safeParse(req.params);
	if (!paramsResult.success) {
		return res.status(400).json({ error: 'Invalid params', details: paramsResult.error.issues });
	}

	const queryResult = listCommentaryQuerySchema.safeParse(req.query);
	if (!queryResult.success) {
		return res.status(400).json({ error: 'Invalid query', details: queryResult.error.issues });
	}

	const limit = Math.min(queryResult.data.limit ?? MAX_LIMIT, MAX_LIMIT);

	try {
		const data = await db
			.select()
			.from(commentary)
			.where(eq(commentary.matchId, paramsResult.data.id))
			.orderBy(desc(commentary.createdAt))
			.limit(limit);

		return res.status(200).json({ data });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to list commentary' });
	}
});

commentaryRouter.post('/', async (req, res) => {
	const paramsResult = matchIdParamSchema.safeParse(req.params);
	if (!paramsResult.success) {
		return res.status(400).json({ error: 'Invalid params', details: paramsResult.error.issues });
	}

	const bodyResult = createCommentarySchema.safeParse(req.body);
	if (!bodyResult.success) {
		return res.status(400).json({ error: 'Invalid payload', details: bodyResult.error.issues });
	}

	try {
		const [entry] = await db.insert(commentary).values({
			...bodyResult.data,
			matchId: paramsResult.data.id,
		}).returning();

		return res.status(201).json({ data: entry });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to create commentary' });
	}
});