class SQLiteStorage implements Storage {
  async getDeals(): Promise<Deal[]> {
    const db = await this.getDb();
    const deals = await db.all<Deal>('SELECT * FROM deals');
    return deals;
  }
} 