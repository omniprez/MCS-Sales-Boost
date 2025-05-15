import { db } from './db';
import { schema } from './schema';
import { eq } from 'drizzle-orm';
import type { Customer, NewCustomer } from './db';

export class PgStorageCustomer {
  async getCustomerById(id: number): Promise<Customer | null> {
    try {
      const customers = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, id))
        .limit(1);
      
      return customers[0] || null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  async createCustomer(customer: NewCustomer): Promise<Customer> {
    try {
      const result = await db
        .insert(schema.customers)
        .values(customer)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: number, customer: Partial<NewCustomer>): Promise<Customer | null> {
    try {
      const result = await db
        .update(schema.customers)
        .set({
          ...customer,
          updatedAt: new Date(),
        })
        .where(eq(schema.customers.id, id))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    try {
      // Check if customer has associated deals
      const associatedDeals = await db
        .select()
        .from(schema.deals)
        .where(eq(schema.deals.customerId, id));
      
      if (associatedDeals.length > 0) {
        console.log('Cannot delete customer with associated deals');
        return false;
      }
      
      // Delete customer
      const result = await db
        .delete(schema.customers)
        .where(eq(schema.customers.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  async listCustomers(): Promise<Customer[]> {
    try {
      return await db
        .select()
        .from(schema.customers)
        .orderBy(schema.customers.createdAt);
    } catch (error) {
      console.error('Error listing customers:', error);
      throw error;
    }
  }
}
