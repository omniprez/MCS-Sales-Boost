// Migration to add contract_length column to deals table

exports.up = async function(knex) {
  // Check if the column already exists to avoid errors
  const hasColumn = await knex.schema.hasColumn('deals', 'contract_length');
  
  if (!hasColumn) {
    return knex.schema.alterTable('deals', function(table) {
      table.integer('contract_length').nullable();
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('deals', function(table) {
    table.dropColumn('contract_length');
  });
};
