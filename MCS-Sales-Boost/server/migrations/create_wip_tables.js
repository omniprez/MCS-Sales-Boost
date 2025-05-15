// Migration to create WIP-related tables

exports.up = async function(knex) {
  // Create wip table
  const wipTableExists = await knex.schema.hasTable('wip');
  if (!wipTableExists) {
    await knex.schema.createTable('wip', function(table) {
      table.increments('id').primary();
      table.integer('deal_id').notNullable().references('id').inTable('deals');
      table.timestamp('projected_delivery_date').nullable();
      table.timestamp('actual_delivery_date').nullable();
      table.timestamp('billing_start_date').nullable();
      table.string('status').notNullable().defaultTo('pending');
      table.text('notes').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Create wip_updates table
  const wipUpdatesTableExists = await knex.schema.hasTable('wip_updates');
  if (!wipUpdatesTableExists) {
    await knex.schema.createTable('wip_updates', function(table) {
      table.increments('id').primary();
      table.integer('wip_id').notNullable().references('id').inTable('wip');
      table.integer('user_id').notNullable().references('id').inTable('users');
      table.timestamp('projected_delivery_date').nullable();
      table.text('notes').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Create revenue_recognition table
  const revenueTableExists = await knex.schema.hasTable('revenue_recognition');
  if (!revenueTableExists) {
    await knex.schema.createTable('revenue_recognition', function(table) {
      table.increments('id').primary();
      table.integer('wip_id').notNullable().references('id').inTable('wip');
      table.string('month').notNullable();
      table.float('amount').notNullable();
      table.boolean('recognized').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  // Drop tables in reverse order to avoid foreign key constraints
  await knex.schema.dropTableIfExists('revenue_recognition');
  await knex.schema.dropTableIfExists('wip_updates');
  await knex.schema.dropTableIfExists('wip');
};
