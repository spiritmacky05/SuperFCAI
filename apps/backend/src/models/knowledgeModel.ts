import { DB } from '../db/database.ts';

export class KnowledgeModel {
  constructor(private readonly db: DB) {}

  getAll() {
    return this.db.query('SELECT * FROM knowledge ORDER BY timestamp DESC');
  }

  save(entry: { id: string; timestamp: number; title: string; content: string; category: string }) {
    const { id, timestamp, title, content, category } = entry;
    return this.db.run('INSERT INTO knowledge (id, timestamp, title, content, category) VALUES (?, ?, ?, ?, ?)', [id, timestamp, title, content, category]);
  }

  deleteById(id: string) {
    return this.db.run('DELETE FROM knowledge WHERE id = ?', [id]);
  }

  async getKnowledgeContextString() {
    const entries = await this.db.query<any>('SELECT * FROM knowledge');
    if (!entries || entries.length === 0) return 'No additional local training data available.';
    return entries.map((e: any) => `--- ${e.title} (${e.category}) ---\n${e.content}`).join('\n\n');
  }
}
