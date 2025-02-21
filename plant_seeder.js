const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
function seedData({
    id,
    nama,
    alamat,
    kab,
    lat,
    lng,
    kapas_admin,
    kapas_kontrak,
    kode_perusahaan,
    lini,
    status,
  }) {
    return new Promise(async (resolve, reject) => {
        if (status === null) {
            status = true
        }
        try {
            await prisma.master_plant.upsert({
                where: {
                    id: id
                },
                update: {
                    nama,
                    alamat,
                    kab,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    kapas_admin,
                    kapas_kontrak,
                    kode_perusahaan,
                    lini,
                    status,
                }, create: {
                    id,
                    nama,
                    alamat,
                    kab,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    kapas_admin,
                    kapas_kontrak,
                    kode_perusahaan,
                    lini,
                    status,
                }
            })

            return resolve()
        } catch (error) {
            
            console.log(error)
            return reject(error)
        }
    })
}

fs.readFile('./master_plant.json', 'utf8', (err, result) => {
    const data = JSON.parse(result)['Result 1']
    data.map(async (value) => {
        await seedData(value)
    })
})