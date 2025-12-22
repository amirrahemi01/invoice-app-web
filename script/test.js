// script/test.js
require('dotenv').config() // Add this line at the top

const { PrismaClient } = require('@prisma/client')

async function test() {
  // Log the DATABASE_URL (hide password)
  const dbUrl = process.env.DATABASE_URL
  console.log('DATABASE_URL exists:', !!dbUrl)
  console.log('DATABASE_URL starts with:', dbUrl?.substring(0, 30) + '...')
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  })
  
  try {
    console.log('\nTesting database connection...')
    await prisma.$connect()
    console.log('✓ Connected to database')
    
    const count = await prisma.invoice.count()
    console.log(`✓ Invoice count: ${count}`)
    
  } catch (error) {
    console.error('✗ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()