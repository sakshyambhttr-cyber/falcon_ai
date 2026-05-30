/**
 * In-memory Memory System for conversation context and idea history.
 *
 * This module intentionally keeps a simple, synchronous in-memory store
 * with async-compatible API surface. It is designed to be replaced with
 * a persistent store (Redis, Postgres, etc.) in production.
 */

export type ConversationEntry = {
  id: string
  role: 'user' | 'system' | 'assistant'
  text: string
  ts: number
}

export class MemoryStore {
  private conversations: Map<string, ConversationEntry[]>
  private ideas: Map<string, string[]>

  constructor(){
    this.conversations = new Map()
    this.ideas = new Map()
  }

  async addConversation(projectId: string, entry: ConversationEntry){
    const list = this.conversations.get(projectId) || []
    list.push(entry)
    this.conversations.set(projectId, list)
  }

  async getConversation(projectId: string){
    return this.conversations.get(projectId) || []
  }

  async clearConversation(projectId: string){
    this.conversations.set(projectId, [])
  }

  async addIdea(projectId: string, idea: string){
    const list = this.ideas.get(projectId) || []
    list.push(idea)
    this.ideas.set(projectId, list)
  }

  async getIdeas(projectId: string){
    return this.ideas.get(projectId) || []
  }
}

export default MemoryStore
