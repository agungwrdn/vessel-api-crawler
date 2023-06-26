// var cron = require('node-cron');
const axios = require('axios');
const moment = require('moment')

// cron.schedule('*/10 * * * *', () => {
//   //broadcastStokReport();
// });

const contact = [
  {
    phone: '+6285232603701',
    name: 'Rahardian Agung Wardana'
  },
  {
    phone: '+6282143608440',
    name: 'Multazam Arroihan Gusdiansyah'
  },
  {
    phone: '+6285335831672',
    name: 'Ilham Izzul Hadyan'
  },
  {
    phone: '+6285648036424',
    name: 'Budi Setiawan'
  }
]

const broadcastStokReport = async () => {
	const reportResult = await axios.get(
		`https://dpcs.pupuk-indonesia.com/api/broadcast?startAt=2023-06-17&endAt=2023-06-23&secretKey=broadcastMessageStokPupukKiosPupukIndonesia`
	);

  const reportNasional = reportResult.data.filter(report => report.region === "NASIONAL")[0]

  let whatsAppMessage = `
Selamat pagi,
Yth. Bapak Direktur Pemasaran
Bapak SVP PM PSO, PSO Wilayah Barat, Wilayah Timur Dan para VP

Menyampaiakan hasil report stok REKAN per tanggal ${moment().locale('id').format('DD MMMM YYYY')} 
Rincian nasional:
Total keseluruhan kios *${reportNasional.totalKios.toLocaleString('id-ID')}*
Total kios melapor *${reportNasional.KiosLapor.toLocaleString('id-ID')}*
Total kios melapor ada stok *${reportNasional.kiosStokAda.toLocaleString('id-ID')}*
Total kios melapor tidak ada stok *${reportNasional.kiosStokKosong.toLocaleString('id-ID')}*
Total kios tidak melapor *${reportNasional.KiosBelumLapor.toLocaleString('id-ID')}*
Tautan melihat detail laporan :
https://dpcs.pupuk-indonesia.com/Kios/SudahLaporRegion
  `

  reportResult.data.map((value, index) => {
    if (index > 0) {
      const totalKios = value.totalKios
      const kiosLapor = value.KiosLapor
      const KiosBelumLapor = value.KiosBelumLapor
      const kiosAda = value.kiosStokAda
      const kiosKosong = value.kiosStokKosong
      whatsAppMessage += `
Rincian *PW ${value.region}* :
Total keseluruhan kios ${totalKios.toLocaleString('id-ID')}
Total kios melapor ${kiosLapor.toLocaleString('id-ID')} (${Math.round(kiosLapor/totalKios*100, 0)}%)
Total kios melapor ada stok ${kiosAda.toLocaleString('id-ID')} (${Math.round(kiosAda/totalKios*100, 0)}%)
Total kios melapor tidak ada stok ${kiosKosong.toLocaleString('id-ID')} (${Math.round(kiosKosong/totalKios*100, 0)}%)
Total kios tidak melapor ${KiosBelumLapor.toLocaleString('id-ID')} (${Math.round(KiosBelumLapor/totalKios*100, 0)}%)
Tautan melihat detail laporan :
https://dpcs.pupuk-indonesia.com/Kios/SudahLaporRegion
    `
    }
  })

  whatsAppMessage += `
Demikian disampaikan agar bisa ditindaklanjuti, terima kasih
  `

  //console.log(whatsAppMessage)
  contact.forEach(async value => {
    console.log('do Sent to:', value.name)
    await axios.post(
      `https://api.wassenger.com/v1/messages`, {
        phone: value.phone,
        message: whatsAppMessage
      }, {
        headers: {
          'Token': 'f28c0f7e2079889e088e25127fc52548e22100ba5cf3726ac338d4e90a90ecf68742426266f8f38f'
        }
      }
    ).then(result => {
      console.log('Finish sent to:', value.name)
    });
  })
};

broadcastStokReport();

