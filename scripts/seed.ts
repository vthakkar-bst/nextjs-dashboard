// This script will contain the seeding logic.
// We need to import necessary modules, define the seed functions,
// and add a main function to execute the seeding.

import bcrypt from 'bcrypt';
import postgres from 'postgres';
// Adjust the path to placeholder-data relative to the new script location
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// Ensure the environment variable is loaded. Consider using dotenv if needed,
// especially if running outside the Next.js environment.
// For now, assume process.env.POSTGRES_URL is available.
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  console.log(`Created "users" table`);

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  console.log(`Seeded ${insertedUsers.length} users`);

  return insertedUsers;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  console.log(`Created "invoices" table`);

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );
  console.log(`Seeded ${insertedInvoices.length} invoices`);

  return insertedInvoices;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  console.log(`Created "customers" table`);

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );
  console.log(`Seeded ${insertedCustomers.length} customers`);

  return insertedCustomers;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  console.log(`Created "revenue" table`);

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );
  console.log(`Seeded ${insertedRevenue.length} revenue entries`);

  return insertedRevenue;
}

// Main function to run all seeding functions
async function main() {
  console.log('Starting database seeding...');
  // Use transaction for seeding operations
  await sql.begin(async (sql) => {
      await seedUsers();
      await seedCustomers();
      await seedInvoices();
      await seedRevenue();
  });
  console.log('Database seeding completed successfully.');
  // Explicitly close the connection
  await sql.end();
}

// Execute the main function and handle potential errors
main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
  // Ensure connection is closed in case of error during seeding
  sql.end({ timeout: 5 }).catch(console.error); // Add timeout for closing
});
