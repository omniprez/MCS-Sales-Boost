// Migration to add closed_date column to deals table

exports.up = async function(knex) {
  // Check if the column already exists to avoid errors
  const hasColumn = await knex.schema.hasColumn('deals', 'closed_date');
  
  if (!hasColumn) {
    return knex.schema.alterTable('deals', function(table) {
      table.timestamp('closed_date').nullable();
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('deals', function(table) {
    table.dropColumn('closed_date');
  });
};
