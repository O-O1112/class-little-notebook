import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * The prototype keeps one shared class workspace. The JSON payload mirrors the
 * client model so new classroom features can be added without a destructive
 * migration while the product is still being shaped.
 */
export const workspaceState = sqliteTable('workspace_state', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
