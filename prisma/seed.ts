import { prisma } from '../src/db.ts'

// Real allocation gets set later via PATCH /master-fund (director role)
const STARTING_BALANCE = 0

async function main() {
    const roleNames = ['organizer', 'director', 'exec']

    for (const name of roleNames) {
        const role = await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        })
        console.log(`role ready: ${role.name} (id ${role.id})`)
    }
    /*
      Master fund
      no unique feild pin to id: 1
      first create then left as is
      re seed will never wipe
    */

    const fund = await prisma.masterFund.upsert({
        where: { id: 1 },
        update: {},
        create: { balance: STARTING_BALANCE },
    })
    console.log(`MasterFund ready: balance ${fund.balance}`)

    const adjustmentCount = await prisma.fundAdjustment.count()
    if (adjustmentCount === 0 && STARTING_BALANCE > 0) {
        await prisma.fundAdjustment.create({
            data: { amount: STARTING_BALANCE, note: 'Master Fund Allocation' },
        })
        console.log('FundAdjustment ready: initial allocation logged')
    }

    /*
      Sample procurement data so /master-fund/summary, /categories, and
      /ledger have something to demo

      (SEED_SAMPLE_DATA=true) plain bun run db:seed never dumps fake requests into the real
      event's database
    */
    const itemCount = await prisma.swagItem.count()
    if (itemCount === 0 && process.env.SEED_SAMPLE_DATA === 'true') {
        const organizerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'organizer' } })
        const organizer = await prisma.user.upsert({
            where: { email: 'ada@technica.org' },
            update: {},
            create: {
                email: 'ada@technica.org',
                passwordHash: 'seed-only-not-a-real-hash',
                name: 'Ada',
                roleId: organizerRole.id,
            },
        })

        const sampleItems = [
            { name: 'Custom Hoodies', category: 'Apparel', quantity: 60, vendorName: 'PrintPros Co.', unitPrice: 60, status: 'approved' },
            { name: 'Tote Bags', category: 'Bags', quantity: 200, vendorName: 'SwagWorks', unitPrice: 8, status: 'approved' },
            { name: 'Laptop Sleeves', category: 'Bags', quantity: 50, vendorName: 'GearGrove', unitPrice: 33, status: 'pending' },
            { name: 'Keychains', category: 'Stickers & Misc', quantity: 300, vendorName: 'SwagWorks', unitPrice: 2.8, status: 'approved' },
        ]

        for (const sample of sampleItems) {
            const totalCost = sample.unitPrice * sample.quantity
            const request = await prisma.request.create({
                data: {
                    userId: organizer.id,
                    status: sample.status,
                    totalCost,
                    approvedAt: sample.status === 'approved' ? new Date() : null,
                },
            })
            const item = await prisma.swagItem.create({
                data: {
                    name: sample.name,
                    category: sample.category,
                    quantity: sample.quantity,
                    requestId: request.id,
                },
            })
            await prisma.quote.create({
                data: {
                    vendorName: sample.vendorName,
                    unitPrice: sample.unitPrice,
                    swagItemId: item.id,
                    isSelected: true,
                },
            })
        }
        console.log(`Seeded ${sampleItems.length} sample items/quotes/requests`)
    } else if (itemCount === 0) {
        console.log('Skipping sample data (set SEED_SAMPLE_DATA=true to include demo items/requests)')
    }
}

main()
    .then(() => console.log('seed complete')).catch((err) => {
        console.error('seed fail: ', err)
        process.exit(1)
    }).finally(async () => {
        await prisma.$disconnect()
    })
