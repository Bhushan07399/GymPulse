class BaseRepository {
  constructor(pool) {
    this.pool = pool;
  }

  query(text, values) {
    return this.pool.query(text, values);
  }
}

module.exports = { BaseRepository };
