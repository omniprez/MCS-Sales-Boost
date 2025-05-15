class MemStorage implements Storage {
  async getDeals(): Promise<Deal[]> {
    return this.deals;
  }
} 