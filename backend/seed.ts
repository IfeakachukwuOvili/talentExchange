import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const seedServices = async () => {
  try {
    const services = [
      {
        name: 'House Cleaning',
        description: 'Professional house cleaning service',
        price: 50.00,
        duration: 120, // 2 hours
        category: 'cleaning'
      },
      {
        name: 'Plumbing Repair',
        description: 'Expert plumbing services',
        price: 75.00,
        duration: 90, // 1.5 hours
        category: 'repair'
      },
      {
        name: 'Lawn Care',
        description: 'Complete lawn maintenance',
        price: 40.00,
        duration: 60, // 1 hour
        category: 'landscaping'
      }
    ]

    for (const service of services) {
      // Check if service exists first
      const existingService = await prisma.service.findFirst({
        where: { name: service.name }
      })
      
      if (!existingService) {
        await prisma.service.create({
          data: service
        })
        console.log(`✅ Created service: ${service.name}`)
      } else {
        console.log(`⚡ Service already exists: ${service.name}`)
      }
    }
    
    console.log('✅ Services seeded successfully')
  } catch (error) {
    console.error('❌ Error seeding services:', error)
  }
}

seedServices()