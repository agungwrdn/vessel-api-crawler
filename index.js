// var cron = require('node-cron');
const axios = require('axios');
const moment = require('moment')

// cron.schedule('*/10 * * * *', () => {
//   //broadcastStokReport();
// });

const contact = [
  // {
  //   phone: '+6285232603701',
  //   name: 'Rahardian Agung Wardana'
  // },
  {
    phone: '+6281545773124',
    name: 'Bhanio Gemilang Putakaz'
  },
  {
    phone: '+6285335831672',
    name: 'Ilham Izzul Hadyan'
  },
  {
    phone: '+6285648036424',
    name: 'Budi Setiawan'
  },
  {
    phone: '+628128874769',
    name: ''
  },
  {
    phone: '+6282322706900',
    name: ''
  },
  {
    phone: '+6282221922192',
    name: ''
  },
  {
    phone: '+628116700772',
    name: ''
  },
  {
    phone: '+6281226568789',
    name: ''
  },
  {
    phone: '+6281280993299',
    name: ''
  },
  {
    phone: '+628111339332',
    name: ''
  },
  {
    phone: '+628164254012',
    name: ''
  },
  {
    phone: '+6285269220503',
    name: ''
  },
  {
    phone: '+62818272627',
    name: ''
  },
  {
    phone: '+62811159262',
    name: 'Dirsar Gusrizal'
  },
  {
    phone: '+628995473332',
    name: 'Legina'
  },
  {
    phone: '+6282213892617',
    name: 'Farkhan'
  },
  {
    phone: '+628125523497',
    name: ''
  },
  {
    phone: '+6281703066766',
    name: ''
  },
  {
    phone: '+6281342900343',
    name: ''
  },
  {
    phone: '+628125819016',
    name: ''
  },

]

const broadcastStokReport = async ({ http = axios, contacts = contact, monitor } = {}) => {
  const phase = (name, callback, details) => monitor && monitor.phase
    ? monitor.phase(name, callback, details)
    : callback()
  let iner = 0;
  let startDate = moment()
  let endDate = moment()
  console.log(startDate.day())
  switch (startDate.day()) {
    case 1:
      iner = -3
      startDate = moment().add(-3, 'd').format('YYYY-MM-DD')
      endDate = endDate.format('YYYY-MM-DD')
      break;
    case 2:
      iner = -4
      startDate = moment().add(-4, 'd').format('YYYY-MM-DD')
      endDate = endDate.format('YYYY-MM-DD')
      break;
    case 3:
      iner = -1
      startDate = moment().add(-1, 'd').format('YYYY-MM-DD')
      endDate = endDate.format('YYYY-MM-DD')
      break;
    case 4:
      iner = -2
      startDate = moment().add(-2, 'd').format('YYYY-MM-DD')
      console.log(startDate)
      endDate = endDate.format('YYYY-MM-DD')
      break;
    case 5: 
      iner = -3
      startDate = moment().add(-3, 'd').format('YYYY-MM-DD')
      endDate = endDate.format('YYYY-MM-DD')
      break;
    case 6:
      iner = -1
      startDate = moment().add(-1, 'd').format('YYYY-MM-DD')
      endDate = endDate.format('YYYY-MM-DD')
      break;
    case 7:
      iner = -2
      startDate = moment().add(-2, 'd').format('YYYY-MM-DD')
      endDate = endDate.format('YYYY-MM-DD')
      break;
    default:
      break;
  }

  console.log(`https://dpcs.pupuk-indonesia.com/api/broadcast?startAt=${startDate}&endAt=${endDate}&secretKey=broadcastMessageStokPupukKiosPupukIndonesia`)
	const reportResult = await phase('fetch-stock-report', () => http.get(
    `https://dpcs.pupuk-indonesia.com/api/broadcast?startAt=${startDate}&endAt=${endDate}&secretKey=broadcastMessageStokPupukKiosPupukIndonesia`
  )).then(result => {
    return result
  })

  const reportNasional = reportResult.data.filter(report => report.region === "NASIONAL")[0]
  const totalKiosNasional = reportNasional.totalKios
  const kiosLaporNasional = reportNasional.KiosLapor
  const KiosBelumLaporNasional = reportNasional.KiosBelumLapor
  const kiosAdaNasional = reportNasional.kiosStokAda
  const kiosKosongNasional = reportNasional.kiosStokKosong
  let whatsAppMessage = `
Selamat pagi,
Yth. Bapak Direktur Pemasaran
Bapak SVP PM PSO, PSO Wilayah Barat, Wilayah Timur Dan para VP

`
if (moment().add(iner, 'd').locale('id') == moment().add(-1, 'days').locale('id')) {
  whatsAppMessage += `Menyampaikan hasil report stok REKAN periode tanggal ${moment().add(iner, 'd').locale('id').format('DD MMMM YYYY')}`
} else {
  whatsAppMessage += `Menyampaikan hasil report stok REKAN periode tanggal ${moment().add(iner, 'd').locale('id').format('DD MMMM YYYY')} s/d ${moment().add(-1, 'days').locale('id').format('DD MMMM YYYY')} `
}
whatsAppMessage += `
Rincian nasional:
Total keseluruhan kios *${reportNasional.totalKios.toLocaleString('id-ID')}* 
Total kios melapor *${reportNasional.KiosLapor.toLocaleString('id-ID')}* (${Math.round(kiosLaporNasional/totalKiosNasional*100, 0)}%)
Total kios melapor ada stok *${reportNasional.kiosStokAda.toLocaleString('id-ID')}* (${Math.round(kiosAdaNasional/totalKiosNasional*100, 0)}%)
Total kios melapor tidak ada stok *${reportNasional.kiosStokKosong.toLocaleString('id-ID')}* (${Math.round(kiosKosongNasional/totalKiosNasional*100, 0)}%)
Total kios tidak melapor *${reportNasional.KiosBelumLapor.toLocaleString('id-ID')}* (${Math.round(KiosBelumLaporNasional/totalKiosNasional*100, 0)}%)
`

  reportResult.data.map((value, index) => {
    if (index > 0) {
      const totalKios = value.totalKios
      const kiosLapor = value.KiosLapor
      const KiosBelumLapor = value.KiosBelumLapor
      const kiosAda = value.kiosStokAda
      const kiosKosong = value.kiosStokKosong
      whatsAppMessage += `
Rincian Penjualan Wilayah *${value.region.split(' ')[1]}* :
Total keseluruhan kios ${totalKios.toLocaleString('id-ID')}
Total kios melapor ${kiosLapor.toLocaleString('id-ID')} (${Math.round(kiosLapor/totalKios*100, 0)}%)
Total kios melapor ada stok ${kiosAda.toLocaleString('id-ID')} (${Math.round(kiosAda/totalKios*100, 0)}%)
Total kios melapor tidak ada stok ${kiosKosong.toLocaleString('id-ID')} (${Math.round(kiosKosong/totalKios*100, 0)}%)
Total kios tidak melapor ${KiosBelumLapor.toLocaleString('id-ID')} (${Math.round(KiosBelumLapor/totalKios*100, 0)}%)
    `
    }
  })

  whatsAppMessage += `
Tautan melihat detail laporan :
https://dpcs.pupuk-indonesia.com/Kios/SudahLaporRegion

Demikian disampaikan agar bisa ditindaklanjuti, terima kasih

*Pesan ini dikirimkah Melalui sistem Notifikasi otomatis Aplikasi Rekan pada tanggal ${moment().locale('id').format('DD MMMM YYYY')} Jam ${moment().locale('id').format('HH:mm')} WIB*
  `
  await Promise.all(contacts.map(async value => {
    console.log('do Sent to:', value.name)
    await phase(`broadcast-stock:${value.phone}`, () => http.post(
      `https://api.wassenger.com/v1/messages`, {
        phone: value.phone,
        message: whatsAppMessage
      }, {
        headers: {
          'Token': 'f28c0f7e2079889e088e25127fc52548e22100ba5cf3726ac338d4e90a90ecf68742426266f8f38f'
        }
      }
    )).then(result => {
      console.log('Finish sent to:', value.name)
    });
  }))
};

if (require.main === module) {
  broadcastStokReport().catch((error) => {
    console.error('Broadcast error:', error.message)
    process.exitCode = 1
  })
}

module.exports = { broadcastStokReport }
