import { prisma } from '../src/db.ts'

// TODO: change when the time comes to full launch
const STARTING_BALANCE = 10_000

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
}

main()
    .then(() => console.log('seed complete')).catch((err) => {
        console.error('seed fail: ', err)
        process.exit(1)
    }).finally(async () => {
        await prisma.$disconnect()
    })
