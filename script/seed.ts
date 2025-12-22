// scripts/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test customer
  const customer = await prisma.customer.create({
    data: {
      name: "John's Cafe",
      email: "john@cafe.com",
      phone: "+1234567890",
      address: "123 Main St"
    }
  })

  // Create test invoice
  const invoice = await prisma.invoice.create({
    data: {
      customerId: customer.id,
      total: 450.00,
      items: {
        create: [
          {
            title: "Web Design Service",
            qty: 2,
            price: 100.00,
            amount: 200.00
          },
          {
            title: "Hosting Package",
            qty: 1,
            price: 250.00,
            amount: 250.00
          }
        ]
      }
    }
  })

  console.log('✅ Seed data created:')
  console.log('- Customer:', customer.name)
  console.log('- Invoice:', invoice.id, 'Total: $', invoice.total)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())