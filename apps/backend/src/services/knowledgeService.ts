import { KnowledgeModel } from '../models/knowledgeModel.ts';

export class KnowledgeService {
  constructor(private readonly knowledge: KnowledgeModel) {}

  list() {
    return this.knowledge.getAll();
  }

  save(entry: any) {
    return this.knowledge.save(entry);
  }

  delete(id: string) {
    return this.knowledge.deleteById(id);
  }

  getKnowledgeContextString() {
    return this.knowledge.getKnowledgeContextString();
  }
}
